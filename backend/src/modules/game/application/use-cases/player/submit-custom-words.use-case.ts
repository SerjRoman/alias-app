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
import {
	GameError,
	PlayerNotFoundError,
} from "../../../domain/errors/game.errors";
import { PLAYERS_UPDATED, type PlayersUpdatedPayload } from "../../game.events";
import { GameEntity } from "../../../domain/entities/game.entity";
import { PlayerEntity } from "../../../domain/entities/player.entity";

@Injectable()
export class SubmitCustomWordsUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly dictionaryService: DictionaryService,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async execute(dto: SubmitCustomWordsDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.assertGameInLobby();

		if (!room.settings.wordsPerPlayer || room.settings.wordsPerPlayer <= 0) {
			throw new GameError(
				"This room does not support custom words submission",
			);
		}

		if (dto.words.length !== room.settings.wordsPerPlayer) {
			throw new GameError(
				`You must submit exactly ${room.settings.wordsPerPlayer} words (received ${dto.words.length})`,
			);
		}

		const player = room.players.find((p) => p.id === actor.id);
		if (!player) {
			throw new PlayerNotFoundError(actor.id);
		}

		return this.submitWordsForPlayer(room, player, dto.words);
	}

	private async submitWordsForPlayer(
		room: GameEntity,
		player: PlayerEntity,
		words: string[],
	) {
		const roomId = room.id;
		const playerId = player.id;

		await this.dictionaryService.setCustomWordsForPlayer(
			roomId,
			playerId,
			words,
		);

		player.setSubmittedWordsCount(words.length);

		await this.gameRepository.saveGame(room);

		const roomPrimitives = room.toPrimitives();
		const eventPayload: PlayersUpdatedPayload = {
			roomId: room.id,
			players: roomPrimitives.players,
		};
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayload);

		return roomPrimitives;
	}
}
