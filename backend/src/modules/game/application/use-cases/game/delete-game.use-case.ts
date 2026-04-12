import { type GameSharedService } from "../../game-shared.service";
import { type IGameRepository } from "../../game.repository.interface";

export class DeleteGameUseCase {
	constructor(
		private readonly gameRepository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
	) {}
	async execute(gameId: string, roomId: string) {
		const room = await this.gameSharedService.loadGame(gameId);
		room.assertRoomOwner(roomId);
		return this.gameRepository.deleteGame(gameId);
	}
}
