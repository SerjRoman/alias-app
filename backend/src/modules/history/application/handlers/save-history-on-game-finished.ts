import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { GameFinishedEvent } from "../../../game/domain/events/game.events";
import {
	HISTORY_REPOSITORY,
	type IHistoryRepository,
} from "../history.repository";

@Injectable()
export class SaveHistoryOnGameFinishedHandler {
	constructor(
		@Inject(HISTORY_REPOSITORY)
		private readonly historyRepo: IHistoryRepository,
	) {}

	@OnEvent(GameFinishedEvent.eventName)
	async handle(event: GameFinishedEvent) {
		const game = await this.historyRepo.findById(event.roomId);
		if (!game) {
			console.warn(
				`Game with id ${event.roomId} not found in history repository.`,
			);
			return;
		}
		game.status = event.gameState.status;
		game.winnerTeamId = event.gameState.winnerTeamId;
		game.teamsFinalState = event.gameState.teams;
		game.playersFinalState = event.gameState.players;
		game.updatedAt = new Date();
		await this.historyRepo.save(game);
	}
}
