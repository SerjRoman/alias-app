import type { GameEntity } from "../domain/entities/game.entity";

export interface IGameRepository {
	findById(roomId: string): Promise<GameEntity | null>;
	findAll(): Promise<GameEntity[]>;
	save(room: GameEntity): Promise<void>;
	delete(roomId: string): Promise<void>;
}

export const GAME_REPOSITORY = "GameRepository";
