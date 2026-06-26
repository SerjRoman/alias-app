import { Injectable } from "@nestjs/common";
import { IDictionaryRepository } from "../application/dictionary.repository.interface";
import { RedisService } from "@common/infrastructure/redis/redis.service";

@Injectable()
export class RedisDictionaryRepository implements IDictionaryRepository {
	private readonly WORDS_PREFIX = "game:words:";
	private readonly CUSTOM_WORDS_PREFIX = "game:custom-words:";
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

	async popWords(roomId: string, count: number): Promise<string[]> {
		const key = `${this.WORDS_PREFIX}${roomId}`;
		const len = await this.redis.llen(key);
		if (len === 0) return [];
		const start = Math.max(0, len - count);
		const words = await this.redis.lrange(key, start, -1);
		if (start === 0) {
			await this.redis.del(key);
		} else {
			await this.redis.ltrim(key, 0, start - 1);
		}
		return words;
	}

	async getLastWord(roomId: string): Promise<string | null> {
		const key = `${this.WORDS_PREFIX}${roomId}`;
		return this.redis.lindex(key, -1);
	}

	async getWords(roomId: string): Promise<string[]> {
		const key = `${this.WORDS_PREFIX}${roomId}`;
		return this.redis.lrange(key, 0, -1);
	}

	async addCustomWords(roomId: string, words: string[]): Promise<void> {
		const key = `${this.CUSTOM_WORDS_PREFIX}${roomId}`;
		if (words.length > 0) {
			await this.redis.rpush(key, ...words);
			await this.redis.expire(key, this.TTL);
		}
	}

	async getCustomWords(roomId: string): Promise<string[]> {
		const key = `${this.CUSTOM_WORDS_PREFIX}${roomId}`;
		return this.redis.lrange(key, 0, -1);
	}

	async clearCustomWords(roomId: string): Promise<void> {
		const key = `${this.CUSTOM_WORDS_PREFIX}${roomId}`;
		await this.redis.del(key);
	}

	async setCustomWordsForPlayer(
		roomId: string,
		playerId: string,
		words: string[],
	): Promise<void> {
		const key = `${this.CUSTOM_WORDS_PREFIX}${roomId}:${playerId}`;
		await this.redis.del(key);
		if (words.length > 0) {
			await this.redis.rpush(key, ...words);
			await this.redis.expire(key, this.TTL);
		}
	}

	async getCustomWordsForPlayer(
		roomId: string,
		playerId: string,
	): Promise<string[]> {
		const key = `${this.CUSTOM_WORDS_PREFIX}${roomId}:${playerId}`;
		return this.redis.lrange(key, 0, -1);
	}

	async clearCustomWordsForPlayer(
		roomId: string,
		playerId: string,
	): Promise<void> {
		const key = `${this.CUSTOM_WORDS_PREFIX}${roomId}:${playerId}`;
		await this.redis.del(key);
	}
}
