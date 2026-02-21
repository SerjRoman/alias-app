import { Injectable } from "@nestjs/common";
import { IGameRepository } from "./game.repository.interface";
import { RedisService } from "../../../common/infrastructure/redis/redis.service";
import { GameEntity, GameState } from "../domain/entities/game.entity";

@Injectable()
export class RedisGameRepository implements IGameRepository {
	private readonly ROOM_PREFIX = "game:";
	private readonly ROOM_TTL = 86400;
	private readonly USER_SOCKET_PREFIX = "user-socket:";

	constructor(private readonly redis: RedisService) {}

	async findById(roomId: string): Promise<GameEntity | null> {
		const data = await this.redis.get(`${this.ROOM_PREFIX}${roomId}`);
		return data
			? GameEntity.fromPrimitives(JSON.parse(data) as GameState)
			: null;
	}

	async findAll(): Promise<GameEntity[]> {
		const keys = await this.redis.keys(`${this.ROOM_PREFIX}*`);
		if (keys.length === 0) {
			return [];
		}
		const roomsData = await this.redis.mget(keys);

		return roomsData
			.filter((data) => data !== null)
			.map((data) =>
				GameEntity.fromPrimitives(JSON.parse(data) as GameState),
			);
	}

	async save(room: GameEntity): Promise<void> {
		await this.redis.set(
			`${this.ROOM_PREFIX}${room.id}`,
			JSON.stringify(room.toPrimitives()),
			"EX",
			this.ROOM_TTL,
		);
	}

	async delete(roomId: string): Promise<void> {
		await this.redis.del(`${this.ROOM_PREFIX}${roomId}`);
	}
	async setUserRoom(userId: string, roomId: string): Promise<void> {
		await this.redis.set(`user:${userId}:room`, roomId, "EX", 86400);
	}
	async getUserRoom(userId: string): Promise<string | null> {
		return this.redis.get(`user:${userId}:room`);
	}
	async removeUserRoom(userId: string): Promise<void> {
		await this.redis.del(`user:${userId}:room`);
	}
}
