import { EventEmitter2 } from "@nestjs/event-emitter";
import {
	PlayerNotFoundError,
	RoomNotFoundError,
} from "../../../domain/errors/game.errors";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { UserDto } from "@common/dto/user.dto";
import { Injectable, Inject, Logger } from "@nestjs/common";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoundScheduler } from "../../round-scheduler.service";
import { TransferOwnershipUseCase } from "../game/transfer-ownership.use-case";
import { OWNER_OFFLINE_TIMEOUT_MS } from "../../../domain/state/game.state";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class SetPlayerOfflineUseCase extends RoomUseCase<string, void> {
	private readonly logger = new Logger(SetPlayerOfflineUseCase.name);
	protected override readonly notify = ["players", "round", "game"] as const;

	constructor(
		fifoQueue: RoomFifoQueueService,
		gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		repository: IGameRepository,
		eventEmitter: EventEmitter2,
		private readonly roundScheduler: RoundScheduler,
		private readonly transferOwnershipUseCase: TransferOwnershipUseCase,
	) {
		super(fifoQueue, gameSharedService, repository, eventEmitter);
	}

	override async execute(roomId: string, actor: UserDto): Promise<void> {
		try {
			await super.execute(roomId, actor);
		} catch (error) {
			if (
				error instanceof RoomNotFoundError ||
				error instanceof PlayerNotFoundError
			) {
				await this.gameRepository.removeUserRoom(actor.id);
				this.logger.warn(
					`Skipped setPlayerOffline for user ${actor.id}: ${error.message}`,
				);
				return;
			}
			throw error;
		}
	}

	protected override handle(
		room: GameEngine,
		_roomId: string,
		actor: UserDto,
	): void {
		room.dispatch({
			type: "SET_PLAYER_OFFLINE",
			actorId: actor.id,
			payload: { playerId: actor.id },
		});
	}

	protected override afterCommit(
		room: GameEngine,
		roomId: string,
		actor: UserDto,
	): void {
		const state = room.getState();

		if (
			state.currentRound &&
			state.currentRound.pausedAt !== null &&
			state.currentRound.pausedAt !== undefined
		) {
			this.roundScheduler.pauseRoundTimeout(roomId);
		}

		if (
			actor.id === state.ownerId &&
			state.ownerOfflineSince !== null &&
			state.ownerOfflineSince !== undefined
		) {
			this.roundScheduler.scheduleOwnerTransferTimeout(
				roomId,
				OWNER_OFFLINE_TIMEOUT_MS,
				async () => {
					try {
						await this.transferOwnershipUseCase.execute(
							{
								roomId,
								timeoutMs: OWNER_OFFLINE_TIMEOUT_MS,
							},
							{
								id: "system",
								name: "System",
								role: "registered",
							},
						);
					} catch (err) {
						this.logger.error(
							`Failed to auto-transfer ownership in room ${roomId}: ${err}`,
						);
					}
				},
			);
		}
	}
}
