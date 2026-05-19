import { GameSharedService } from "../../game-shared.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class FindOneGameUseCase {
	constructor(private readonly gameSharedService: GameSharedService) {}
	async execute(gameId: string) {
		return this.gameSharedService.loadGame(gameId);
	}
}
