import { UserDto } from "@common/dto/user.dto";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { UpdateGameSettingsDto } from "../../dto/body";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class UpdateGameSettingsUseCase {
	constructor(
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
	) {}
	async execute(settingsDto: UpdateGameSettingsDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(settingsDto.roomId);
		room.assertRoomOwner(actor.id);
		room.updateSettings(settingsDto, actor.id);
		await this.gameRepository.saveGame(room);
		return room.toPrimitives();
	}
}
