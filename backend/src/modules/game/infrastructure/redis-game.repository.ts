import { Injectable } from "@nestjs/common";
import { IGameRepository } from "../application/game.repository.interface";
import { RedisService } from "../../../common/infrastructure/redis/redis.service";
import { GameEntity, GameState } from "../domain/entities/game.entity";
import { PlayerEntity, PlayerState } from "../domain/entities/player.entity";
import { RoundEntity, RoundState } from "../domain/entities/round.entity";
import { TeamEntity, TeamState } from "../domain/entities/team.entity";

@Injectable()
export class RedisGameRepository implements IGameRepository {
	private readonly ROOM_PREFIX = "game:";
	private readonly USER_PREFIX = "user:";
	private readonly USER_TO_ROOM_PREFIX = "user-room:";
	private readonly ROUND_PREFIX = "round:";
	private readonly TEAM_PREFIX = "team:";
	private readonly TTL = 86400;

	constructor(private readonly redis: RedisService) {}
	async findGameById(gameId: string): Promise<GameEntity | null> {
		const key = `${this.ROOM_PREFIX}${gameId}`;
		return this.redis.get(key).then((data) => {
			if (!data) return null;
			return GameEntity.fromPrimitives(JSON.parse(data) as GameState);
		});
	}
	async findAllGames(): Promise<GameEntity[]> {
		const pattern = `${this.ROOM_PREFIX}*`;
		const keys = await this.redis.keys(pattern);
		if (keys.length === 0) {
			return [];
		}
		const gamesData = await this.redis.mget(keys);
		return gamesData
			.filter((data) => data !== null)
			.map((data) =>
				GameEntity.fromPrimitives(JSON.parse(data) as GameState),
			);
	}
	async saveGame(game: GameEntity): Promise<void> {
		const key = `${this.ROOM_PREFIX}${game.id}`;
		await this.redis.set(
			key,
			JSON.stringify(game.toPrimitives()),
			"EX",
			this.TTL,
		);
	}
	async deleteGame(gameId: string): Promise<void> {
		const key = `${this.ROOM_PREFIX}${gameId}`;
		await this.redis.del(key);
	}
	async findTeamById(teamId: string): Promise<TeamEntity | null> {
		const key = `${this.TEAM_PREFIX}${teamId}`;
		return this.redis.get(key).then((data) => {
			if (!data) return null;
			return TeamEntity.fromPrimitives(JSON.parse(data) as TeamState);
		});
	}
	async findTeamsByGameId(
		_gameId: string,
		teamIds: string[],
	): Promise<TeamEntity[]> {
		if (teamIds.length === 0) return [];
		const keys = teamIds.map((teamId) => `${this.TEAM_PREFIX}${teamId}`);
		const values = await this.redis.mget(keys);
		return values
			.filter((v): v is string => v !== null)
			.map((v) => TeamEntity.fromPrimitives(JSON.parse(v) as TeamState));
	}
	async saveTeam(team: TeamEntity): Promise<void> {
		const key = `${this.TEAM_PREFIX}${team.id}`;
		await this.redis.set(
			key,
			JSON.stringify(team.toPrimitives()),
			"EX",
			this.TTL,
		);
	}
	async deleteTeam(teamId: string): Promise<void> {
		const key = `${this.TEAM_PREFIX}${teamId}`;
		await this.redis.del(key);
	}
	async findRoundById(roundId: string): Promise<RoundEntity | null> {
		const key = `${this.ROUND_PREFIX}${roundId}`;
		return this.redis.get(key).then((data) => {
			if (!data) return null;
			return RoundEntity.fromPrimitives(JSON.parse(data) as RoundState);
		});
	}
	async saveRound(round: RoundEntity): Promise<void> {
		const key = `${this.ROUND_PREFIX}${round.id}`;
		await this.redis.set(
			key,
			JSON.stringify(round.toPrimitives()),
			"EX",
			this.TTL,
		);
	}
	async deleteRound(roundId: string): Promise<void> {
		const key = `${this.ROUND_PREFIX}${roundId}`;
		await this.redis.del(key);
	}
	async findPlayerById(playerId: string): Promise<PlayerEntity | null> {
		const key = `${this.USER_PREFIX}${playerId}`;
		return this.redis.get(key).then((data) => {
			if (!data) return null;
			return PlayerEntity.fromPrimitives(JSON.parse(data) as PlayerState);
		});
	}
	async findPlayersByGameId(
		_gameId: string,
		playerIds: string[],
	): Promise<PlayerEntity[]> {
		if (playerIds.length === 0) return [];
		const keys = playerIds.map(
			(playerId) => `${this.USER_PREFIX}${playerId}`,
		);
		const values = await this.redis.mget(keys);
		return values
			.filter((v): v is string => v !== null)
			.map((v) =>
				PlayerEntity.fromPrimitives(JSON.parse(v) as PlayerState),
			);
	}
	async savePlayer(player: PlayerEntity): Promise<void> {
		const key = `${this.USER_PREFIX}${player.id}`;
		await this.redis.set(
			key,
			JSON.stringify(player.toPrimitives()),
			"EX",
			this.TTL,
		);
	}
	async deletePlayer(playerId: string): Promise<void> {
		const key = `${this.USER_PREFIX}${playerId}`;
		await this.redis.del(key);
	}
	async setUserRoom(userId: string, roomId: string): Promise<void> {
		const key = `${this.USER_TO_ROOM_PREFIX}${userId}`;
		await this.redis.set(key, roomId, "EX", this.TTL);
	}
	async getUserRoom(userId: string): Promise<string | null> {
		const key = `${this.USER_TO_ROOM_PREFIX}${userId}`;
		return this.redis.get(key);
	}
	async removeUserRoom(userId: string): Promise<void> {
		const key = `${this.USER_TO_ROOM_PREFIX}${userId}`;
		await this.redis.del(key);
	}
}
