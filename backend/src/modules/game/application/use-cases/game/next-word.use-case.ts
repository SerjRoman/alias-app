import { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundNotActiveError } from "../../../domain/errors/round.errors";
import { ROUND_UPDATED, type RoundUpdatedPayload } from "../../game.events";
import { GameSharedService } from "../../game-shared.service";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../../game.repository.interface";
import { DictionaryService } from "../../dictionary.service";
import { UserDto } from "@common/dto/user.dto";
import { NextWordDto } from "../../dto/body";
import { Inject } from "@nestjs/common";

export class NextWordUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
		private readonly dictionaryService: DictionaryService,
	) {}

	async execute(dto: NextWordDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);

		if (!room.currentRound) {
			throw new RoundNotActiveError();
		}

		room.assertRoundInProgress();
		room.assertIsGuesser(actor.id);

		const text = await this.dictionaryService.popWordForGame(room.id);
		const newWord = room.nextWord(actor.id, text, dto.wasSkipped);
		await this.gameRepository.saveGame(room);

		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);

		return { newWord };
	}
}
