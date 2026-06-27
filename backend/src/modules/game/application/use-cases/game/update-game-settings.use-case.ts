import { UserDto } from "@common/dto/user.dto";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { UpdateGameSettingsDto } from "../../dto/body";
import { Injectable, Inject, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
	GAME_SETTINGS_UPDATED,
	type GameSettingsUpdatedPayload,
} from "../../game.events";
import { DictionaryService } from "../../dictionary.service";

@Injectable()
export class UpdateGameSettingsUseCase {
	private readonly logger = new Logger(UpdateGameSettingsUseCase.name);

	constructor(
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
		private readonly dictionaryService: DictionaryService,
	) {}
	async execute(settingsDto: UpdateGameSettingsDto, actor: UserDto) {
		const { roomId, ...settingsToUpdate } = { ...settingsDto };
		const room = await this.gameSharedService.loadGame(roomId);
		room.assertRoomOwner(actor.id);

		const hatModeChanged =
			settingsDto.isHatMode !== undefined &&
			settingsDto.isHatMode !== room.settings.isHatMode;
		const wordsPerPlayerChanged =
			settingsDto.wordsPerPlayer !== undefined &&
			settingsDto.wordsPerPlayer !== room.settings.wordsPerPlayer;

		room.updateSettings(settingsToUpdate, actor.id);
		await this.gameRepository.saveGame(room);

		if (hatModeChanged || wordsPerPlayerChanged) {
			const playerIds = room.toPrimitives().players.map((p) => p.id);
			await Promise.all(
				playerIds.map((playerId) =>
					this.dictionaryService
						.clearCustomWordsForPlayer(roomId, playerId)
						.catch((err) =>
							this.logger.error(
								`Failed to clear custom words for player ${playerId} on settings update`,
								err,
							),
						),
				),
			);
		}

		const roomPrimitives = room.toPrimitives();
		const eventPayload: GameSettingsUpdatedPayload = {
			roomId: roomPrimitives.id,
			settings: roomPrimitives.settings,
		};
		this.eventEmitter.emit(GAME_SETTINGS_UPDATED, eventPayload);

		return roomPrimitives;
	}
}
