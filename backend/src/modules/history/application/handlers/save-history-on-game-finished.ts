import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { GameFinishedEvent } from "../../../game/domain/events/game.events";
import {
	HISTORY_REPOSITORY,
	type IHistoryRepository,
} from "../history.repository";

@Injectable()
export class SaveHistoryOnGameFinishedHandler {
	private readonly logger = new Logger(SaveHistoryOnGameFinishedHandler.name);

	constructor(
		@Inject(HISTORY_REPOSITORY)
		private readonly historyRepo: IHistoryRepository,
	) {}

	@OnEvent(GameFinishedEvent.eventName)
	async handle(event: GameFinishedEvent) {
		this.logger.log(
			`Received GameFinishedEvent with payload=${JSON.stringify(event)}`,
		);

		await this.historyRepo.updateGameState(
			event.roomId,
			event.gameState.status,
			event.gameState.winnerTeamId,
		);
	}
}
