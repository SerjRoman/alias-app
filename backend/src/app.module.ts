import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule } from "./common/infrastructure/redis/redis.module";
import { GameModule } from "./modules/game/game.module";
import { UserModule } from "./modules/user/user.module";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./common/strategies/jwt.strategy";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";
import { CloudinaryModule } from "@common/infrastructure/cloudinary";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HistoryModule } from "./modules/history/history.module";
import { LoggerModule } from "nestjs-pino";

@Module({
	providers: [JwtStrategy],
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		EventEmitterModule.forRoot({ global: true }),
		ScheduleModule.forRoot({}),
		TypeOrmModule.forRootAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				type: "postgres",
				host: configService.getOrThrow<string>("DB_HOST"),
				port: configService.get<number>("DB_PORT", 5432),
				username: configService.getOrThrow<string>("DB_USERNAME"),
				password: configService.getOrThrow<string>("DB_PASSWORD"),
				database: configService.getOrThrow<string>("DB_NAME"),
				autoLoadEntities: true,
				synchronize: true,
				ssl: true,
			}),
		}),
		CloudinaryModule,
		RedisModule,
		PassportModule,
		JwtModule.registerAsync({
			inject: [ConfigService],
			global: true,
			useFactory: (configService: ConfigService) => ({
				secret: configService.getOrThrow<string>("JWT_SECRET_KEY"),
			}),
		}),
		UserModule,
		GameModule,
		HistoryModule,
		LoggerModule.forRoot({
			pinoHttp: {
				transport: {
					targets:
						process.env.NODE_ENV === "production"
							? [
									{
										target: "pino-pretty",
										options: {
											colorize: true,
											singleLine: true,
										},
										level: "info",
									},
								]
							: [
									{
										target: "pino/file",
										options: {
											destination: "./logs/app.log",
											mkdir: true,
										},
										level: "info",
									},
								],
				},
			},
		}),
	],
})
export class AppModule {}
