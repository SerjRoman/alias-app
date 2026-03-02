import {
	Injectable,
	Logger,
	type OnModuleDestroy,
	type OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService
	extends Redis
	implements OnModuleDestroy, OnModuleInit
{
	private readonly logger = new Logger(RedisService.name);
	constructor(private readonly configService: ConfigService) {
		super({
			password: configService.getOrThrow("REDIS_SERVICE_PASSWORD"),
			host: configService.getOrThrow("REDIS_SERVICE_HOST"),
			port: configService.getOrThrow("REDIS_SERVICE_PORT"),
			maxLoadingRetryTime: 5,
			enableOfflineQueue: true,
		});
	}
	onModuleInit() {
		const start = Date.now();

		this.logger.log("Init Redis connection...");
		this.on("connect", () => {
			this.logger.log("Redis connecting...");
		});
		this.on("ready", () => {
			const ms = Date.now() - start;
			this.logger.log(`Redis connected (time=${ms})`);
		});
		this.on("error", (error) => {
			this.logger.error("Redis error", { error: error.message ?? error });
		});
		this.on("close", () => {
			this.logger.log("Redis connection closed");
		});
		this.on("reconnecting", () => {
			this.logger.log("Redis reconnecting...");
		});
	}
	async onModuleDestroy() {
		this.logger.log("Closing Redis connection...");
		try {
			await this.quit();
			this.logger.log("Redis connection closed");
		} catch (error) {
			this.logger.error("Redis error", {
				error,
			});
		}
	}
}
