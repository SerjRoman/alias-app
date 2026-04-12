import { type GameSharedService } from "../../game-shared.service";

export class FindOneGameUseCase {
	constructor(private readonly gameSharedService: GameSharedService) {}
	async execute(gameId: string) {
		return this.gameSharedService.loadGame(gameId);
	}
}
