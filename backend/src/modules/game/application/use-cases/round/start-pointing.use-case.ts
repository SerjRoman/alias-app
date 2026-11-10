import { Injectable, Inject } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundNotActiveError } from "../../../domain/errors/round.errors";
import { GameSharedService } from "../../game-shared.service";
import { type RoundUpdatedPayload } from "../../game.events";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { UserDto } from "@common/dto/user.dto";
import { StartPointingDto } from "../../dto/body";
import { RoundScheduler } from "../../round-scheduler.service";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class StartPointingUseCase extends RoomUseCase<
	StartPointingDto,
	RoundUpdatedPayload | null
> {
	protected override readonly notify = ["round"] as const;

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
		dto: StartPointingDto,
		actor: UserDto,
	): RoundUpdatedPayload | null {
		const currentRound = engine.getState().currentRound;
		if (!currentRound) {
			throw new RoundNotActiveError();
		}

		engine.dispatch({
			type: "START_POINTING",
			actorId: actor.id,
		});

		this.roundScheduler.clearRoundTimeout(dto.roomId);

		const updatedRound = engine.getState().currentRound;
		if (updatedRound) {
			return {
				round: updatedRound,
				roomId: dto.roomId,
			};
		}
		return null;
	}
}
