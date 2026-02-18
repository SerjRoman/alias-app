import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule } from "./common/infrastructure/redis/redis.module";
import { GameModule } from "./modules/game/game.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./common/strategies/jwt.strategy";
import { TeamModule } from './modules/team/team.module';

@Module({
	providers: [JwtStrategy],
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
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
		TeamModule,
	],
})
export class AppModule {}
