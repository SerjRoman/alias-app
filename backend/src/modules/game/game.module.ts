import { Module } from "@nestjs/common";
import { GameFacade } from "./application/facades/game.facade";
import { PlayerFacade } from "./application/facades/player.facade";
import { RoundFacade } from "./application/facades/round.facade";
import { TeamFacade } from "./application/facades/team.facade";
import { GameSharedService } from "./application/game-shared.service";
import { GameController } from "./presentation/game.controller";
import { GAME_REPOSITORY } from "./application/game.repository.interface";
import { RoundScheduler } from "./application/round-scheduler.service";
import { RedisGameRepository } from "./infrastructure/redis-game.repository";
import { GameGateway } from "./presentation/game.gateway";
import { DictionaryService } from "./application/dictionary.service";

@Module({
	providers: [
		GameGateway,
		GameSharedService,
		RoundScheduler,
		GameFacade,
		PlayerFacade,
		RoundFacade,
		TeamFacade,
		DictionaryService,
		{
			provide: GAME_REPOSITORY,
			useClass: RedisGameRepository,
		},
	],
	controllers: [GameController],
	exports: [GameFacade, PlayerFacade, RoundFacade, TeamFacade],
})
export class GameModule {}
