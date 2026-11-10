import type { GameEngine } from "../domain/engine/game-engine";

export interface IGameRepository {
	// Game
	findGameById(gameId: string): Promise<GameEngine | null>;
	findAllGames(): Promise<GameEngine[]>;
	saveGame(game: GameEngine): Promise<void>;
	deleteGame(gameId: string): Promise<void>;
	setGameTtl(gameId: string, ttlSeconds: number): Promise<void>;

	// User-Room mapping
	setUserRoom(userId: string, roomId: string): Promise<void>;
	getUserRoom(userId: string): Promise<string | null>;
	removeUserRoom(userId: string): Promise<void>;
	removeUserRooms(userIds: string[]): Promise<number | void>;
}
export const GAME_REPOSITORY = "GameRepository";
