import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { GameStartedEvent } from "../../../game/domain/events/game.events";
import { HistoryGameEntity } from "../../domain/history.entity";
import {
	HISTORY_REPOSITORY,
	type IHistoryRepository,
} from "../history.repository";

@Injectable()
export class SaveGameOnGameStartHandler {
	constructor(
		@Inject(HISTORY_REPOSITORY)
		private readonly historyRepo: IHistoryRepository,
	) {}
	@OnEvent(GameStartedEvent.eventName)
	async handle(event: GameStartedEvent) {
		const playerTeamMap = new Map(
			event.gameState.teams.flatMap((team) =>
				team.playerIds.map((playerId) => [playerId, team.id] as const),
			),
		);
		const history = HistoryGameEntity.fromPrimitives({
			id: event.gameState.id,
			status: event.gameState.status,
			ownerId: event.gameState.ownerId,
			participants: event.gameState.players.map((player) => ({
				id: player.id,
				name: player.name,
				teamId: playerTeamMap.get(player.id)!,
				userId: player.role === "registered" ? player.id : null,
				finalScore: player.score,
			})),
			settings: event.gameState.settings,
			teamsFinalState: [],
			playersFinalState: [],
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
	}
}
