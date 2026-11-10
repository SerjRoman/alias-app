import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { GameStartedEvent, type GameSettings } from "../../../game/domain";
import { HistoryGameEntity } from "../../domain/history.entity";
import {
	HISTORY_REPOSITORY,
	type IHistoryRepository,
} from "../history.repository";

@Injectable()
export class SaveGameOnGameStartHandler {
	private readonly logger = new Logger(SaveGameOnGameStartHandler.name);

	constructor(
		@Inject(HISTORY_REPOSITORY)
		private readonly historyRepo: IHistoryRepository,
	) {}
	@OnEvent(GameStartedEvent.eventName)
	async handle(event: GameStartedEvent) {
		try {
			this.logger.log(
				`Received GameStartedEvent with payload=${JSON.stringify(event)}`,
			);
			const playerTeamMap = new Map(
				event.gameState.teams.flatMap((team) =>
					(team.playerIds ?? []).map(
						(playerId) => [playerId, team.id] as const,
					),
				),
			);
			const history = HistoryGameEntity.fromPrimitives({
				id: event.gameState.id,
				status: event.gameState.status,
				ownerId: event.gameState.ownerId,
				participants: event.gameState.players.map((player) => ({
					id: `${event.gameState.id}:${player.id}`,
					name: player.name,
					teamId: playerTeamMap.get(player.id) ?? player.teamId ?? "",
					userId: player.role === "registered" ? player.id : null,
					finalScore: player.score ?? 0,
				})),
				settings: (event.gameState.settings ?? {}) as GameSettings,
				winnerTeamId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
				rounds: [],
				teams: event.gameState.teams.map((team) => ({
					id: team.id,
					name: team.name,
				})),
			});
			await this.historyRepo.save(history);
		} catch (error) {
			this.logger.error(
				`Failed to save game history on game start for roomId=${event.roomId ?? event.gameState?.id}: ${error instanceof Error ? error.message : String(error)}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
}
