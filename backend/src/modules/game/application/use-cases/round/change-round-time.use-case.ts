import { UserDto } from "@common/dto/user.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ChangeRoundTimeDto } from "../../dto/body";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { RoundScheduler } from "../../round-scheduler.service";
import {
	RoundIsNotInProgress,
	RoundNotActiveError,
} from "../../../domain/errors/round.errors";
import { Injectable, Inject } from "@nestjs/common";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoundStatus } from "../../../domain";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class ChangeRoundTimeUseCase extends RoomUseCase<
	ChangeRoundTimeDto,
	void
> {
	protected override readonly notify = ["round"] as const;

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

	protected override handle(
		game: GameEngine,
		dto: ChangeRoundTimeDto,
		actor: UserDto,
	): void {
		const round = game.getState().currentRound;
		if (!round) {
			throw new RoundNotActiveError();
		}
		if (round.status !== RoundStatus.IN_PROGRESS) {
			throw new RoundIsNotInProgress();
		}

		const timeDeltaMs = dto.seconds * 1000;
		const now = Date.now();
		const currentRemaining = round.pausedAt
			? (round.remainingMs ?? 0)
			: Math.max(0, round.expiresAt - now);
		const newRemaining = Math.max(0, currentRemaining + timeDeltaMs);
		const newExpiresAt = now + newRemaining;

		// 1. Сначала домен валидирует права (владелец) и мутирует состояние
		game.dispatch({
			type: "CHANGE_ROUND_TIME",
			actorId: actor.id,
			payload: { expiresAt: newExpiresAt },
		});

		// 2. После успешного доменного dispatch применяем сайд-эффект в шедулере
		this.roundScheduler.changeRoundTime(dto.roomId, timeDeltaMs);
	}
}
