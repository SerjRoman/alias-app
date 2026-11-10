import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { UserDto } from "@common/dto/user.dto";
import { GameSharedService } from "../../game-shared.service";
import { DictionaryService } from "../../dictionary.service";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../../game.repository.interface";
import { SubmitCustomWordsDto } from "../../dto/body/submit-custom-words.dto";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import type { GameState } from "../../../domain/state/game.state";

@Injectable()
export class SubmitCustomWordsUseCase extends RoomUseCase<
	SubmitCustomWordsDto,
	GameState
> {
	protected override readonly notify = ["players"] as const;

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
		room: GameEngine,
		dto: SubmitCustomWordsDto,
		actor: UserDto,
	): Promise<void> {
		room.dispatch({
			type: "SUBMIT_CUSTOM_WORDS",
			actorId: actor.id,
			payload: { wordsCount: dto.words.length },
		});

		await this.dictionaryService.setCustomWordsForPlayer(
			room.id,
			actor.id,
			dto.words,
		);
	}
}
