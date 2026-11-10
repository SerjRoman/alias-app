import { GameStatus } from "../../../domain";
import { GameSharedService } from "../../game-shared.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GetPrivatePlayerStateUseCase {
	constructor(private readonly gameSharedService: GameSharedService) {}

	async execute(roomId: string, userId: string) {
		const room = await this.gameSharedService.loadGame(roomId);
		const state = room.getState();

		if (state.status !== GameStatus.IN_PROGRESS || !state.currentRound) {
			return null;
		}

		if (state.currentRound.explainerId !== userId) {
			return null;
		}

		return {
			word: state.currentRound.currentWord,
		};
	}
}
