import { Injectable } from "@nestjs/common";
import { IDictionaryRepository } from "../application/dictionary.repository.interface";
import { RedisService } from "../../../common/infrastructure/redis/redis.service";

@Injectable()
export class RedisDictionaryRepository implements IDictionaryRepository {
	private readonly WORDS_PREFIX = "game:words:";
	private readonly TTL = 86400; // 24 hours

	constructor(private readonly redis: RedisService) {}

	async setWords(roomId: string, words: string[]): Promise<void> {
		const key = `${this.WORDS_PREFIX}${roomId}`;
		await this.redis.del(key);
		if (words.length > 0) {
			await this.redis.rpush(key, ...words);
			await this.redis.expire(key, this.TTL);
		}
	}

	async popWord(roomId: string): Promise<string | null> {
		const key = `${this.WORDS_PREFIX}${roomId}`;
		return this.redis.rpop(key);
	}

	async getLastWord(roomId: string): Promise<string | null> {
		const key = `${this.WORDS_PREFIX}${roomId}`;
		return this.redis.lindex(key, -1);
	}

	async getWords(roomId: string): Promise<string[]> {
		const key = `${this.WORDS_PREFIX}${roomId}`;
		return this.redis.lrange(key, 0, -1);
	}
}
