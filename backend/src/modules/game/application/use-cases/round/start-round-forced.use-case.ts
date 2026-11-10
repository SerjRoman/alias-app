import { EventEmitter2 } from "@nestjs/event-emitter";
import { NoWordsAvailableError } from "../../../domain/errors/game.errors";
import { GameSharedService } from "../../game-shared.service";
import { type RoundUpdatedPayload, ROUND_UPDATED } from "../../game.events";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../../game.repository.interface";
import { RoundScheduler } from "../../round-scheduler.service";
import { StartRoundDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { DictionaryService } from "../../dictionary.service";
import { Inject, Injectable } from "@nestjs/common";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoundStatus } from "../../../domain";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class StartRoundForcedUseCase extends RoomUseCase<
	StartRoundDto,
	RoundUpdatedPayload
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
		room: GameEngine,
		dto: StartRoundDto,
		actor: UserDto,
	): Promise<RoundUpdatedPayload> {
		const state = room.getState();
		room.assertCanStartRound(actor.id, true);

		const text = await this.dictionaryService.popWordForGame(room.id);
		if (!text) {
			throw new NoWordsAvailableError();
		}

		const durationSeconds =
			state.roundTimeSeconds ?? state.settings?.roundTimeSeconds ?? 60;

		room.dispatch({
			type: "START_ROUND",
			actorId: actor.id,
			payload: {
				durationSeconds,
				firstWordText: text,
				force: true,
			},
		});

		this.roundScheduler.scheduleRoundTimeout(
			room.id,
			durationSeconds * 1000,
			() => {
				void this.handleRoundTimeout(room.id);
			},
		);

		return {
			round: room.toPrimitives().currentRound!,
			roomId: room.id,
		};
	}

	private async handleRoundTimeout(roomId: string) {
		await this.fifoQueue.run(roomId, async () => {
			const room = await this.gameSharedService.loadGame(roomId);
			const currentRound = room.getState().currentRound;
			if (currentRound?.status !== RoundStatus.IN_PROGRESS) {
				return;
			}

			room.dispatch({
				type: "START_POINTING",
				actorId: "system",
			});
			await this.gameRepository.saveGame(room);

			const updatedRound = room.toPrimitives().currentRound!;
			const eventPayload: RoundUpdatedPayload = {
				round: updatedRound,
				roomId: room.id,
			};
			this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
		});
	}
}
