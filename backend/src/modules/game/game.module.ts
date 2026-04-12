import { Module } from "@nestjs/common";
import { GameService } from "./application/game.service";
import { GameController } from "./presentation/game.controller";
import { GAME_REPOSITORY } from "./application/game.repository.interface";
import { RedisGameRepository } from "./infrastructure/redis-game.repository";
import { GameGateway } from "./presentation/game.gateway";
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
export class GameModule { }
