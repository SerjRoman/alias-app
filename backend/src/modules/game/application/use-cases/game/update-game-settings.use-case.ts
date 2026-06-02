import { UserDto } from "@common/dto/user.dto";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { UpdateGameSettingsDto } from "../../dto/body";
import { Injectable, Inject } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GAME_UPDATED, type GameUpdatedPayload } from "../../game.events";

@Injectable()
export class UpdateGameSettingsUseCase {
	constructor(
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(settingsDto: UpdateGameSettingsDto, actor: UserDto) {
		const {roomId, ...settingsToUpdate} = { ...settingsDto };
		const room = await this.gameSharedService.loadGame(roomId);
		room.assertRoomOwner(actor.id);

		room.updateSettings(settingsToUpdate, actor.id);
		await this.gameRepository.saveGame(room);

		const roomPrimitives = room.toPrimitives();
		const eventPayload: GameUpdatedPayload = {
			room: roomPrimitives,
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);

		return roomPrimitives;
	}
}
