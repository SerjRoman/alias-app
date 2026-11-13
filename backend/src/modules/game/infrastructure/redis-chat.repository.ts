import { Injectable } from "@nestjs/common";
import { RedisService } from "../../../common/infrastructure/redis/redis.service";
import type {
	ChatMessageDto,
	SystemLogEntryDto,
} from "../application/chat/chat.types";

@Injectable()
export class RedisChatRepository {
	private readonly MESSAGES_PREFIX = "game-chat:messages:";
	private readonly LOGS_PREFIX = "game-chat:logs:";
	private readonly LEADER_PREFIX = "game-chat:leader:";
	private readonly MAX_ITEMS = 50;
	private readonly TTL_SECONDS = 86400;

	constructor(private readonly redis: RedisService) {}

	async appendMessage(roomId: string, msg: ChatMessageDto): Promise<void> {
		const key = `${this.MESSAGES_PREFIX}${roomId}`;
		await this.redis.rpush(key, JSON.stringify(msg));
		await this.redis.ltrim(key, -this.MAX_ITEMS, -1);
		await this.redis.expire(key, this.TTL_SECONDS);
	}

	async getMessages(
		roomId: string,
		userTeamId?: string,
	): Promise<ChatMessageDto[]> {
		const key = `${this.MESSAGES_PREFIX}${roomId}`;
		const raw = await this.redis.lrange(key, 0, -1);
		const parsed: ChatMessageDto[] = [];
		for (const item of raw) {
			try {
				const msg = JSON.parse(item) as ChatMessageDto;
				if (msg.channel === "all" || (userTeamId && msg.teamId === userTeamId)) {
					parsed.push(msg);
				}
			} catch {
				// Ignore malformed entries
			}
		}
		return parsed;
	}

	async appendLog(roomId: string, log: SystemLogEntryDto): Promise<void> {
		const key = `${this.LOGS_PREFIX}${roomId}`;
		await this.redis.rpush(key, JSON.stringify(log));
		await this.redis.ltrim(key, -this.MAX_ITEMS, -1);
		await this.redis.expire(key, this.TTL_SECONDS);
	}

	async getLogs(roomId: string, userId: string): Promise<SystemLogEntryDto[]> {
		const key = `${this.LOGS_PREFIX}${roomId}`;
		const raw = await this.redis.lrange(key, 0, -1);
		const parsed: SystemLogEntryDto[] = [];
		for (const item of raw) {
			try {
				const log = JSON.parse(item) as SystemLogEntryDto;
				if (!log.isPrivate || log.targetUserId === userId) {
					const { targetUserId: _omitted, ...publicView } = log;
					parsed.push(publicView);
				}
			} catch {
				// Ignore malformed entries
			}
		}
		return parsed;
	}

	async getLastLeaderTeamId(roomId: string): Promise<string | null> {
		const key = `${this.LEADER_PREFIX}${roomId}`;
		return this.redis.get(key);
	}

	async setLastLeaderTeamId(
		roomId: string,
		teamId: string | null,
	): Promise<void> {
		const key = `${this.LEADER_PREFIX}${roomId}`;
		if (teamId === null) {
			await this.redis.del(key);
			return;
		}
		await this.redis.set(key, teamId, "EX", this.TTL_SECONDS);
	}

	async clearRoomChat(roomId: string): Promise<void> {
		await this.redis.del(
			`${this.MESSAGES_PREFIX}${roomId}`,
			`${this.LOGS_PREFIX}${roomId}`,
			`${this.LEADER_PREFIX}${roomId}`,
		);
	}
}
