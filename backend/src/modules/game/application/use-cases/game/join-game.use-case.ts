import { EventEmitter2 } from "@nestjs/event-emitter";
import { InvalidGameCode } from "../../../domain/errors/game.errors";
import { GameSharedService } from "../../game-shared.service";
import { PLAYERS_UPDATED, TEAMS_UPDATED } from "../../game.events";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { UserDto } from "@common/dto/user.dto";
import { JoinGameDto } from "../../dto/body";
import { Injectable, Inject } from "@nestjs/common";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoundScheduler } from "../../round-scheduler.service";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import { RoundStatus, type GameState } from "../../../domain";

@Injectable()
export class JoinGameUseCase extends RoomUseCase<JoinGameDto, GameState> {
	protected override readonly notify = [
		"game",
		"players",
		"teams",
		"round",
	] as const;

	constructor(
		fifoQueue: RoomFifoQueueService,
		gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		repository: IGameRepository,
		eventEmitter: EventEmitter2,
		private readonly roundScheduler: RoundScheduler,
	) {
		super(fifoQueue, gameSharedService, repository, eventEmitter);
	}

	override async execute(
		dto: JoinGameDto,
		actor: UserDto,
	): Promise<GameState> {
		const currentRoomId = await this.gameRepository.getUserRoom(actor.id);
		if (currentRoomId && currentRoomId !== dto.roomId) {
			try {
				await this.fifoQueue.run(currentRoomId, async () => {
					const oldRoom =
						await this.gameSharedService.loadGame(currentRoomId);
					oldRoom.dispatch({
						type: "LEAVE_GAME",
						actorId: actor.id,
						payload: { playerId: actor.id },
					});
					await this.gameRepository.saveGame(oldRoom);
					await this.gameRepository.removeUserRoom(actor.id);

					const oldRoomPrimitives = oldRoom.toPrimitives();
					this.eventEmitter.emit(TEAMS_UPDATED, {
						roomId: oldRoom.id,
						teams: oldRoomPrimitives.teams,
					});
					this.eventEmitter.emit(PLAYERS_UPDATED, {
						roomId: oldRoom.id,
						players: oldRoomPrimitives.players,
					});
				});
			} catch {
				await this.gameRepository.removeUserRoom(actor.id);
			}
		}

		return super.execute(dto, actor);
	}

	protected override async handle(
		room: GameEngine,
		dto: JoinGameDto,
		actor: UserDto,
	): Promise<GameState> {
		const state = room.getState();
		if (state.settings?.isPrivate && state.settings?.code) {
			if (!dto.code) {
				throw new InvalidGameCode();
			}
			if (
				!(await this.gameSharedService.validateCode(
					dto.roomId,
					dto.code,
				))
			) {
				throw new InvalidGameCode();
			}
		}

		room.dispatch({
			type: "JOIN_GAME",
			actorId: actor.id,
			payload: {
				playerId: actor.id,
				name: actor.name,
				role: actor.role,
			},
		});

		return room.toPrimitives();
	}

	protected override async afterCommit(
		room: GameEngine,
		dto: JoinGameDto,
		actor: UserDto,
	): Promise<void> {
		await this.gameRepository.setUserRoom(actor.id, room.id);

		const updatedState = room.getState();
		if (updatedState.ownerOfflineSince === null) {
			this.roundScheduler.clearOwnerTransferTimeout(dto.roomId);
		}
		if (
			updatedState.currentRound?.status === RoundStatus.IN_PROGRESS &&
			!updatedState.currentRound.pausedAt
		) {
			const remaining = Math.max(
				0,
				updatedState.currentRound.expiresAt - Date.now(),
			);
			this.roundScheduler.resumeRoundTimeout(dto.roomId, remaining);
		}
	}
}
