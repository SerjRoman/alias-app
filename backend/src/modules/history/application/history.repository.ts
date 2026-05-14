import { HistoryRoundEntity } from "../domain/history-round.entity";
import { HistoryGameEntity } from "../domain/history.entity";

export interface IHistoryRepository {
	save(gameHistory: HistoryGameEntity): Promise<void>;
	findGamesByUserIdWithRelations(
		userId: string,
		limit: number,
		offset: number,
	): Promise<[HistoryGameEntity[], number]>;
	findByIdWithRelations(gameId: string): Promise<HistoryGameEntity | null>;
	updateGameState(
		gameId: string,
		status: string,
		winnerTeamId: string | null,
	): Promise<void>;
}

export interface IHistoryRoundRepository {
	save(round: HistoryRoundEntity): Promise<void>;
	findById(id: string): Promise<HistoryRoundEntity | null>;
	findRoundsByGameId(
		gameId: string,
		limit: number,
		offset: number,
	): Promise<[HistoryRoundEntity[], number]>;
}

export const HISTORY_REPOSITORY = "HistoryRepository";
export const HISTORY_ROUND_REPOSITORY = "HistoryRoundRepository";
