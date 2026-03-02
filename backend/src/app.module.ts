import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule } from "./common/infrastructure/redis/redis.module";
import { GameModule } from "./modules/game/game.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./common/strategies/jwt.strategy";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
	providers: [JwtStrategy],
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		EventEmitterModule.forRoot({ global: true }),
		ScheduleModule.forRoot({}),
		RedisModule,
		PassportModule,
		JwtModule.registerAsync({
			inject: [ConfigService],
			global: true,
			useFactory: (configService: ConfigService) => ({
				secret: configService.getOrThrow<string>("JWT_SECRET_KEY"),
			}),
		}),
		AuthModule,
		GameModule,
	],
})
export class AppModule {}
