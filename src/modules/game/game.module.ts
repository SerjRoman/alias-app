import { Module } from "@nestjs/common";
import { GameService } from "./application/game.service";
import { GameController } from "./application/game.controller";
import { GAME_REPOSITORY } from "./repository/game.repository.interface";
import { RedisGameRepository } from "./repository/redis-game.repository";
import { GameGateway } from "./application/game.gateway";
import { DictionaryService } from "./application/dictionary.service";

@Module({
	providers: [
		GameGateway,
		GameService,
		DictionaryService,
		{
			provide: GAME_REPOSITORY,
			useClass: RedisGameRepository,
		},
	],
	controllers: [GameController],
})
export class GameModule {}
