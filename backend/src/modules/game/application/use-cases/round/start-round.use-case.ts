import { EventEmitter2 } from "@nestjs/event-emitter";
import { NoWordsAvailableError } from "../../../domain/errors/game.errors";
import { GameSharedService } from "../../game-shared.service";
import { type RoundUpdatedPayload, ROUND_UPDATED } from "../../game.events";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { RoundScheduler } from "../../round-scheduler.service";
import { StartRoundDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { DictionaryService } from "../../dictionary.service";
import { Injectable, Inject } from "@nestjs/common";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import { RoundStatus, type WordItem } from "../../../domain";

@Injectable()
export class StartRoundUseCase extends RoomUseCase<
	StartRoundDto,
	{ word: WordItem | null | undefined }
> {
	protected override readonly notify = ["round"] as const;

	constructor(
		fifoQueue: RoomFifoQueueService,
		gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		gameRepository: IGameRepository,
		eventEmitter: EventEmitter2,
		private readonly roundScheduler: RoundScheduler,
		private readonly dictionaryService: DictionaryService,
	) {
		super(fifoQueue, gameSharedService, gameRepository, eventEmitter);
	}

	protected override async handle(
		engine: GameEngine,
		dto: StartRoundDto,
		actor: UserDto,
	): Promise<{ word: WordItem | null | undefined }> {
		engine.assertCanStartRound(actor.id, false);

		const text = await this.dictionaryService.popWordForGame(dto.roomId);
		if (!text) {
			throw new NoWordsAvailableError();
		}

		const durationSeconds =
			engine.getState().roundTimeSeconds ??
			engine.getState().settings?.roundTimeSeconds ??
			60;

		engine.dispatch({
			type: "START_ROUND",
			actorId: actor.id,
			payload: {
				durationSeconds,
				firstWordText: text,
			},
		});

		this.roundScheduler.scheduleRoundTimeout(
			dto.roomId,
			durationSeconds * 1000,
			() => this.handleRoundTimeout(dto.roomId),
		);

		return { word: engine.getState().currentRound?.currentWord };
	}

	private async handleRoundTimeout(roomId: string): Promise<void> {
		await this.fifoQueue.run(roomId, async () => {
			const engine: GameEngine =
				await this.gameSharedService.loadGame(roomId);

			const currentRound = engine.getState().currentRound;
			if (currentRound?.status !== RoundStatus.IN_PROGRESS) {
				return;
			}

			engine.dispatch({
				type: "START_POINTING",
				actorId: "system",
			});

			await this.gameRepository.saveGame(engine);

			const updatedRound = engine.getState().currentRound;
			if (updatedRound) {
				const eventPayload: RoundUpdatedPayload = {
					round: updatedRound,
					roomId,
				};
				this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
			}
		});
	}
}
