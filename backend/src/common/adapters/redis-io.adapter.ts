import { IoAdapter } from "@nestjs/platform-socket.io";
import type { Server, ServerOptions } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { RedisService } from "../infrastructure/redis/redis.service";
import { type INestApplicationContext, Logger } from "@nestjs/common";

export class RedisIoAdapter extends IoAdapter {
	private readonly logger = new Logger(RedisIoAdapter.name);
	private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

	constructor(private readonly app: INestApplicationContext) {
		super(app);
	}

	async connectToRedis(): Promise<void> {
		try {
			const pubClient = this.app.get(RedisService);
			const subClient = pubClient.duplicate();

			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => {
					reject(new Error("Redis subClient connection timed out"));
				}, 5000);

				subClient.on("ready", () => {
					clearTimeout(timeout);
					this.logger.log(
						"Redis subClient connected for Socket.IO horizontal scaling",
					);
					resolve();
				});

				subClient.on("error", (err) => {
					clearTimeout(timeout);
					reject(err);
				});
			});

			this.adapterConstructor = createAdapter(pubClient, subClient);
			this.logger.log("Socket.IO Redis adapter configured successfully");
		} catch (error) {
			this.logger.warn(
				`Failed to initialize Redis adapter for Socket.IO, falling back to in-memory adapter: ${error}`,
			);
		}
	}

	override createIOServer(port: number, options?: ServerOptions): Server {
		const server = super.createIOServer(port, options) as Server;
		if (this.adapterConstructor) {
			server.adapter(this.adapterConstructor);
		}
		return server;
	}
}
