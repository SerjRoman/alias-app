import { UserDto } from "@common/dto/user.dto";
import { Injectable, Inject } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import type { GameState } from "../../../domain/state/game.state";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundScheduler } from "../../round-scheduler.service";

interface LeaveGameContext extends Record<string, unknown> {
	wasOwner?: boolean;
}

@Injectable()
export class LeaveGameUseCase extends RoomUseCase<
	string,
	GameState,
	LeaveGameContext
> {
	protected override notify = ["teams", "players", "game", "round"] as const;

	constructor(
		fifoQueue: RoomFifoQueueService,
		gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY) gameRepository: IGameRepository,
		eventEmitter: EventEmitter2,
		private readonly roundScheduler: RoundScheduler,
	) {
		super(fifoQueue, gameSharedService, gameRepository, eventEmitter);
	}

	protected override beforeHandle(
		room: GameEngine,
		_roomId: string,
		actor: UserDto,
		context: LeaveGameContext,
	): void {
		context.wasOwner = room.getState().ownerId === actor.id;
	}

	protected override handle(
		room: GameEngine,
		_roomId: string,
		actor: UserDto,
	) {
		room.dispatch({
			type: "LEAVE_GAME",
			actorId: actor.id,
			payload: { playerId: actor.id },
		});
	}

	protected override async afterCommit(
		room: GameEngine,
		roomId: string,
		actor: UserDto,
		_result: GameState | void,
		context: LeaveGameContext,
	) {
		await this.gameRepository.removeUserRoom(actor.id);
		const round = room.getState().currentRound;
		if (round && round.pausedAt !== null && round.pausedAt !== undefined) {
			this.roundScheduler.pauseRoundTimeout(roomId);
		}
		if (context.wasOwner) {
			this.roundScheduler.clearOwnerTransferTimeout(roomId);
		}
	}
}
