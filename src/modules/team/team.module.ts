import { Module } from "@nestjs/common";
import { TeamService } from "./team.service";
import { TeamController } from "./team.controller";
import { GAME_REPOSITORY } from "../game/repository/game.repository.interface";
import { RedisGameRepository } from "../game/repository/redis-game.repository";

@Module({
	controllers: [TeamController],
	providers: [
		TeamService,
		{
			provide: GAME_REPOSITORY,
			useClass: RedisGameRepository,
		},
	],
})
export class TeamModule {}
