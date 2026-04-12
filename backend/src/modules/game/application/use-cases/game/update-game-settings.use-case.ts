import { type UpdateGameSettingsDto } from "../../../dto/body";
import { type GameSharedService } from "../../game-shared.service";
import { type IGameRepository } from "../../game.repository.interface";

export class UpdateGameSettingsUseCase {
	constructor(
		private readonly gameRepository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
	) {}
	async execute(settingsDto: UpdateGameSettingsDto, actorId: string) {
		const room = await this.gameSharedService.loadGame(settingsDto.roomId);
		room.assertRoomOwner(actorId);
		room.updateSettings(settingsDto, actorId);
		await this.gameRepository.saveGame(room);
		return room.toPrimitives();
	}
}
