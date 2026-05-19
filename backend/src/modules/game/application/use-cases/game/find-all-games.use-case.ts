import { Injectable, Inject } from "@nestjs/common";
import {
    GAME_REPOSITORY,
    type IGameRepository,
} from "../../game.repository.interface";

@Injectable()
export class FindAllGamesUseCase {
    constructor(
        @Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
    ) { }
    async execute() {
        const games = await this.repository.findAllGames();
        return games.map((game) => game.toPrimitives());
    }
}
