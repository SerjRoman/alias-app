import { Module } from "@nestjs/common";
import { GameService } from "./application/game.service";
import { GameController } from "./application/game.controller";
import { GAME_REPOSITORY } from "./repository/game.repository.interface";
import { RedisGameRepository } from "./repository/redis-game.repository";
import { GameGateway } from "./application/game.gateway";

@Module({
	providers: [
		GameGateway,
		GameService,
		{
			provide: GAME_REPOSITORY,
			useClass: RedisGameRepository,
		},
	],
	controllers: [GameController],
})
export class GameModule {}
