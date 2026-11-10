import { Injectable, Inject } from "@nestjs/common";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { UserDto } from "@common/dto/user.dto";
import { GameSharedService } from "../../game-shared.service";
import { EndPointingDto } from "../../dto/body";
import { type GameFinishedPayload, GAME_FINISHED } from "../../game.events";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundScheduler } from "../../round-scheduler.service";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class EndPointingUseCase extends RoomUseCase<EndPointingDto, void> {
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
		dto: EndPointingDto,
		actor: UserDto,
	): void {
		engine.dispatch({
			type: "END_POINTING",
			actorId: actor.id,
		});
	}

	protected override async afterCommit(engine: GameEngine): Promise<void> {
		if (engine.getState().status === "FINISHED") {
			await this.roundScheduler.scheduleGameDeletion(
				engine.getState().id,
				24 * 60 * 60 * 1000,
			);
			const finishedPayload: GameFinishedPayload = {
				room: engine.toPrimitives(),
			};
			this.eventEmitter.emit(GAME_FINISHED, finishedPayload);
		}
	}
}
