import { Injectable } from "@nestjs/common";
import { RedisService } from "@common/infrastructure/redis/redis.service";

@Injectable()
export class LogoutUseCase {
	private readonly REFRESH_PREFIX = "user-refresh:";

	constructor(private readonly redisService: RedisService) {}

	async execute(userId: string): Promise<void> {
		const key = `${this.REFRESH_PREFIX}${userId}`;
		await this.redisService.del(key);
	}
}
