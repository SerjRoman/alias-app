import { Injectable, Inject } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import type { UserDto } from "@common/dto/user.dto";
import type { ResumeGameDto } from "../../dto/body";
import { RoundScheduler } from "../../round-scheduler.service";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import type { GameState } from "../../../domain/state/game.state";

@Injectable()
export class ResumeRoundUseCase extends RoomUseCase<ResumeGameDto, GameState> {
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
		_dto: ResumeGameDto,
		actor: UserDto,
	): GameState {
		engine.dispatch({
			type: "RESUME_GAME",
			actorId: actor.id,
		});

		return engine.toPrimitives();
	}

	protected override afterCommit(
		_engine: GameEngine,
		dto: ResumeGameDto,
	): void {
		this.roundScheduler.resumeAll(dto.roomId);
	}
}
