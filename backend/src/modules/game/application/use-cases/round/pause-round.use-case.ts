import { Injectable, Inject } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import type { UserDto } from "@common/dto/user.dto";
import type { PauseGameDto } from "../../dto/body";
import { RoundScheduler } from "../../round-scheduler.service";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import type { GameState } from "../../../domain/state/game.state";

@Injectable()
export class PauseRoundUseCase extends RoomUseCase<PauseGameDto, GameState> {
	protected override readonly notify = ["game", "round"] as const;

	constructor(
		fifoQueue: RoomFifoQueueService,
		gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		gameRepository: IGameRepository,
		eventEmitter: EventEmitter2,
		private readonly roundScheduler: RoundScheduler,
	) {
		super(fifoQueue, gameSharedService, gameRepository, eventEmitter);
	}

	protected override handle(
		engine: GameEngine,
		_dto: PauseGameDto,
		actor: UserDto,
	): GameState {
		engine.dispatch({
			type: "PAUSE_GAME",
			actorId: actor.id,
		});

		return engine.toPrimitives();
	}

	protected override afterCommit(
		_engine: GameEngine,
		dto: PauseGameDto,
	): void {
		this.roundScheduler.pauseAll(dto.roomId);
	}
}
