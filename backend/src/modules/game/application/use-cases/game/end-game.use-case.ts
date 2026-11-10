import { UserDto } from "@common/dto/user.dto";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { GAME_FINISHED, type GameFinishedPayload } from "../../game.events";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EndGameDto } from "../../dto/body/end-game.dto";
import { Injectable, Inject } from "@nestjs/common";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoundScheduler } from "../../round-scheduler.service";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import type { GameState } from "../../../domain";

@Injectable()
export class EndGameUseCase extends RoomUseCase<EndGameDto, GameState> {
	protected override readonly notify = ["game"] as const;

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
		dto: EndGameDto,
		actor: UserDto,
	): void {
		engine.dispatch({
			type: "END_GAME",
			actorId: actor.id,
		});

		this.roundScheduler.clearRoundTimeout(dto.roomId);
	}

	protected override async afterCommit(
		engine: GameEngine,
		dto: EndGameDto,
	): Promise<void> {
		await this.roundScheduler.scheduleGameDeletion(
			dto.roomId,
			24 * 60 * 60 * 1000,
		);

		const finishedPayload: GameFinishedPayload = {
			room: engine.toPrimitives(),
		};
		this.eventEmitter.emit(GAME_FINISHED, finishedPayload);
	}
}
