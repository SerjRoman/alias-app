import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameSharedService } from "../../game-shared.service";
import { type PlayerKickedPayload, PLAYER_KICKED } from "../../game.events";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { KickPlayerDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { Injectable, Inject, Optional } from "@nestjs/common";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoomUseCase } from "../room.use-case";
import { RoundScheduler } from "../../round-scheduler.service";
import type { GameEngine } from "../../../domain/engine/game-engine";
import type { GameState } from "../../../domain";

@Injectable()
export class KickPlayerUseCase extends RoomUseCase<KickPlayerDto, GameState> {
	protected override readonly notify = [
		"teams",
		"players",
		"game",
		"round",
	] as const;

	constructor(
		fifoQueue: RoomFifoQueueService,
		gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		gameRepository: IGameRepository,
		eventEmitter: EventEmitter2,
		@Optional()
		private readonly roundScheduler?: RoundScheduler,
	) {
		super(fifoQueue, gameSharedService, gameRepository, eventEmitter);
	}

	protected override handle(
		engine: GameEngine,
		dto: KickPlayerDto,
		actor: UserDto,
	): void {
		engine.dispatch({
			type: "KICK_PLAYER",
			actorId: actor.id,
			payload: { targetPlayerId: dto.playerId },
		});
	}

	protected override async afterCommit(
		engine: GameEngine,
		dto: KickPlayerDto,
	): Promise<void> {
		await this.gameRepository.removeUserRoom(dto.playerId);

		const round = engine.getState().currentRound;
		if (round && round.pausedAt !== null && round.pausedAt !== undefined) {
			this.roundScheduler?.pauseRoundTimeout(engine.id);
		}

		const eventPayload: PlayerKickedPayload = {
			kickedUserId: dto.playerId,
			roomId: engine.id,
		};
		this.eventEmitter.emit(PLAYER_KICKED, eventPayload);
	}
}
