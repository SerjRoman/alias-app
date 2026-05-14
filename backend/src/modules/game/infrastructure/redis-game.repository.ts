import { Injectable } from "@nestjs/common";
import { IGameRepository } from "../application/game.repository.interface";
import { RedisService } from "../../../common/infrastructure/redis/redis.service";
import { GameEntity, GameState } from "../domain/entities/game.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class RedisGameRepository implements IGameRepository {
	private readonly ROOM_PREFIX = "game:";
	private readonly USER_TO_ROOM_PREFIX = "user-room:";
	private readonly TTL = 86400;

	constructor(
		private readonly redis: RedisService,
		private readonly eventEmitter: EventEmitter2,
	) {}
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
		const events = game.pullDomainEvents();
		for (const event of events) {
			this.eventEmitter.emit(event.name, event);
		}
	}
	async deleteGame(gameId: string): Promise<void> {
		const key = `${this.ROOM_PREFIX}${gameId}`;
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
