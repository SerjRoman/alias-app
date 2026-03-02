import type { GameEntity } from "../domain/entities/game.entity";
import type { PlayerEntity } from "../domain/entities/player.entity";
import type { RoundEntity } from "../domain/entities/round.entity";
import type { TeamEntity } from "../domain/entities/team.entity";

export interface IGameRepository {
	// Game
	findGameById(gameId: string): Promise<GameEntity | null>;
	findAllGames(): Promise<GameEntity[]>;
	saveGame(game: GameEntity): Promise<void>;
	deleteGame(gameId: string): Promise<void>;

	// Team
	findTeamById(teamId: string): Promise<TeamEntity | null>;
	findTeamsByGameId(gameId: string, teamIds: string[]): Promise<TeamEntity[]>;
	saveTeam(team: TeamEntity): Promise<void>;
	deleteTeam(teamId: string): Promise<void>;

	// Round
	findRoundById(roundId: string): Promise<RoundEntity | null>;
	saveRound(round: RoundEntity): Promise<void>;
	deleteRound(roundId: string): Promise<void>;

	// Player
	findPlayerById(
		playerId: string,
		gameId: string,
	): Promise<PlayerEntity | null>;
	findPlayersByGameId(
		gameId: string,
		playerIds: string[],
	): Promise<PlayerEntity[]>;
	savePlayer(player: PlayerEntity): Promise<void>;
	deletePlayer(playerId: string): Promise<void>;

	// User-Room mapping
	setUserRoom(userId: string, roomId: string): Promise<void>;
	getUserRoom(userId: string): Promise<string | null>;
	removeUserRoom(userId: string): Promise<void>;
}
export const GAME_REPOSITORY = "GameRepository";
