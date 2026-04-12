import { type GameSharedService } from "../../game-shared.service";
import { type IGameRepository } from "../../game.repository.interface";

export class FinishGameUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly gameRepository: IGameRepository,
	) {}
	async execute(roomId: string, actorId?: string) {
		const room = await this.gameSharedService.loadGame(roomId);
		room.finishGame(actorId);
		await this.gameRepository.saveGame(room);
		return room.toPrimitives();
	}
}
