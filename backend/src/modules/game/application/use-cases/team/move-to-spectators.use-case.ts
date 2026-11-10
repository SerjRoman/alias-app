import { MoveToSpectatorsDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { Injectable, Inject, Optional } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundScheduler } from "../../round-scheduler.service";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class MoveToSpectatorsUseCase extends RoomUseCase<MoveToSpectatorsDto> {
	protected override notify = ["teams", "players", "game", "round"] as const;

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
		room: GameEngine,
		dto: MoveToSpectatorsDto,
		actor: UserDto,
	) {
		const targetPlayerId = dto.playerId ?? actor.id;

		room.dispatch({
			type: "MOVE_TO_SPECTATORS",
			actorId: dto.playerId ? actor.id : undefined,
			payload: {
				playerId: targetPlayerId,
			},
		});
	}

	protected override afterCommit(room: GameEngine) {
		const round = room.getState().currentRound;
		if (round && round.pausedAt !== null && round.pausedAt !== undefined) {
			this.roundScheduler?.pauseRoundTimeout(room.id);
		}
	}
}
