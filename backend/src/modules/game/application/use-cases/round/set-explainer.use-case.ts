import { UserDto } from "@common/dto/user.dto";
import { SetExplainerDto } from "../../dto/body";
import { Injectable, Inject } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundScheduler } from "../../round-scheduler.service";

@Injectable()
export class SetExplainerUseCase extends RoomUseCase<SetExplainerDto> {
	protected override notify = ["round"] as const;

	constructor(
		fifoQueue: RoomFifoQueueService,
		gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY) gameRepository: IGameRepository,
		eventEmitter: EventEmitter2,
		private readonly roundScheduler: RoundScheduler,
	) {
		super(fifoQueue, gameSharedService, gameRepository, eventEmitter);
	}

	protected override handle(
		room: GameEngine,
		dto: SetExplainerDto,
		actor: UserDto,
	) {
		room.dispatch({
			type: "SET_EXPLAINER",
			actorId: actor.id,
			payload: { explainerId: dto.playerId },
		});
	}

	protected override afterCommit(room: GameEngine, dto: SetExplainerDto) {
		const round = room.getState().currentRound;
		if (
			round &&
			round.status === "IN_PROGRESS" &&
			!round.pausedAt &&
			round.endTime > Date.now()
		) {
			const remaining = Math.max(0, round.endTime - Date.now());
			this.roundScheduler.resumeRoundTimeout(dto.roomId, remaining);
		}
	}
}
