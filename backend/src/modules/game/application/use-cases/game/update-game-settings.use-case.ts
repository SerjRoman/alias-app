import { UserDto } from "@common/dto/user.dto";
import { type GameSharedService } from "../../game-shared.service";
import { type IGameRepository } from "../../game.repository.interface";
import { UpdateGameSettingsDto } from "../../dto/body";

export class UpdateGameSettingsUseCase {
	constructor(
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
