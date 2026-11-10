import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { GameFinishedEvent } from "../../../game/domain";
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
		try {
			this.logger.log(
				`Received GameFinishedEvent with payload=${JSON.stringify(event)}`,
			);

			const activeParticipants = (event.gameState?.players ?? []).map(
				(player) => ({
					id: `${event.gameState.id}:${player.id}`,
					name: player.name,
					teamId: player.teamId ?? "",
					userId: player.role === "registered" ? player.id : null,
					finalScore: player.score ?? 0,
				}),
			);

			const leftParticipants = (event.gameState?.leftPlayers ?? []).map(
				(player) => ({
					id: `${event.gameState.id}:${player.id}`,
					name: player.name,
					teamId: player.teamId ?? "",
					userId: player.id,
					finalScore: player.score ?? 0,
				}),
			);

			const allParticipants = [
				...activeParticipants,
				...leftParticipants,
			];

			await this.historyRepo.updateGameState(
				event.roomId,
				event.gameState.status,
				event.gameState.winnerTeamId ?? null,
				allParticipants,
			);
		} catch (error) {
			this.logger.error(
				`Failed to update game history on game finished for roomId=${event.roomId}: ${error instanceof Error ? error.message : String(error)}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
}
