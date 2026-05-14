import { HistoryRoundEntity } from "../domain/history-round.entity";
import { HistoryGameEntity } from "../domain/history.entity";

export interface IHistoryRepository {
	save(gameHistory: HistoryGameEntity): Promise<void>;
	findGamesByUserIdWithRelations(userId: string): Promise<HistoryGameEntity[]>;
	findById(gameId: string): Promise<HistoryGameEntity | null>;
}

export interface IHistoryRoundRepository {
	save(round: HistoryRoundEntity): Promise<void>;
}

export const HISTORY_REPOSITORY = "HistoryRepository";
export const HISTORY_ROUND_REPOSITORY = "HistoryRoundRepository";
