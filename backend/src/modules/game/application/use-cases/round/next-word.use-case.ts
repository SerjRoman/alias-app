import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameSharedService } from "../../game-shared.service";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../../game.repository.interface";
import { DictionaryService } from "../../dictionary.service";
import { UserDto } from "@common/dto/user.dto";
import { NextWordDto } from "../../dto/body";
import { Inject, Injectable } from "@nestjs/common";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import type { WordItem } from "../../../domain";

@Injectable()
export class NextWordUseCase extends RoomUseCase<
	NextWordDto,
	{ newWord: WordItem | null | undefined }
> {
	protected override readonly notify = ["round"] as const;

	constructor(
		fifoQueue: RoomFifoQueueService,
		gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		gameRepository: IGameRepository,
		eventEmitter: EventEmitter2,
		private readonly dictionaryService: DictionaryService,
	) {
		super(fifoQueue, gameSharedService, gameRepository, eventEmitter);
	}

	protected override async handle(
		engine: GameEngine,
		dto: NextWordDto,
		actor: UserDto,
	): Promise<{ newWord: WordItem | null | undefined }> {
		const actionType = dto.wasSkipped ? "WORD_SKIPPED" : "WORD_GUESSED";
		engine.assertCanCycleWord(actor.id, actionType);

		const text = await this.dictionaryService.popWordForGame(dto.roomId);
		const { state } = engine.dispatch({
			type: actionType,
			actorId: actor.id,
			payload: { nextWordText: text },
		});

		return { newWord: state.currentRound?.currentWord };
	}
}
