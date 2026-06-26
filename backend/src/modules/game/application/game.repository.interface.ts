import type { GameEntity } from "../domain/entities/game.entity";

export interface IGameRepository {
	// Game
	findGameById(gameId: string): Promise<GameEntity | null>;
	findAllGames(): Promise<GameEntity[]>;
	saveGame(game: GameEntity): Promise<void>;
	deleteGame(gameId: string): Promise<void>;

	// User-Room mapping
	setUserRoom(userId: string, roomId: string): Promise<void>;
	getUserRoom(userId: string): Promise<string | null>;
	removeUserRoom(userId: string): Promise<void>;
	removeUserRooms(userIds: string[]): Promise<number | void>;
}
export const GAME_REPOSITORY = "GameRepository";
