import { GameStatus } from "../../../domain/entities/game.entity";
import type { GameSharedService } from "../../game-shared.service";

export class GetPrivatePlayerStateUseCase {
	constructor(private readonly gameSharedService: GameSharedService) {}

	async execute(roomId: string, userId: string) {
		const room = await this.gameSharedService.loadGame(roomId);

		if (room.status !== GameStatus.IN_PROGRESS || !room.currentRound) {
			return null;
		}

		if (room.currentRound.guesserId !== userId) {
			return null;
		}

		return {
			word: room.currentRound.currentWord,
		};
	}
}
