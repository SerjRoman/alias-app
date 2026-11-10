import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { RoundFinishedEvent } from "../../../game/domain";
import { HistoryRoundEntity } from "../../domain/history-round.entity";
import {
	HISTORY_ROUND_REPOSITORY,
	type IHistoryRoundRepository,
} from "../history.repository";

@Injectable()
export class SaveRoundOnRoundFinishedHandler {
	private readonly logger = new Logger(SaveRoundOnRoundFinishedHandler.name);

	constructor(
		@Inject(HISTORY_ROUND_REPOSITORY)
		private readonly historyRoundRepository: IHistoryRoundRepository,
	) {}
	@OnEvent(RoundFinishedEvent.eventName)
	async handle(event: RoundFinishedEvent) {
		try {
			this.logger.log(
				`Received RoundFinishedEvent with payload=${JSON.stringify(event)}`,
			);
			const currentRound = event.gameState?.currentRound;
			if (!currentRound) {
				this.logger.warn(
					`RoundFinishedEvent for gameId=${event.gameState?.id} has no current round.`,
				);
				return;
			}
			const participants = event.gameState.teams.flatMap((team) =>
				(team.playerIds ?? []).map((playerId) => {
					const playerState =
						event.gameState.players.find(
							(p) => p.id === playerId,
						) ??
						event.gameState.leftPlayers?.find(
							(p) => p.id === playerId,
						);
					if (!playerState) {
						throw new Error(
							`Player with ID ${playerId} not found in game state`,
						);
					}
					return {
						id: `${currentRound.id}-${playerId}`,
						playerId,
						teamId: team.id,
						roundId: currentRound.id,
						scoreAfterRound: playerState.score ?? 0,
					};
				}),
			);
			const roundEntity = HistoryRoundEntity.fromPrimitives({
				id: currentRound.id,
				gameId: event.gameState.id,
				roundNumber: currentRound.roundNumber,
				words: currentRound.words,
				explainerId: currentRound.explainerId,
				teamId: currentRound.teamId,
				participants: participants,
			});
			await this.historyRoundRepository.save(roundEntity);
		} catch (error) {
			this.logger.error(
				`Failed to save round history on round finished for roomId=${event.roomId ?? event.gameState?.id}: ${error instanceof Error ? error.message : String(error)}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
}
