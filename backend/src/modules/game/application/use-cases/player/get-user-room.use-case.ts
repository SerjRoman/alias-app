import { type IGameRepository, GAME_REPOSITORY } from "../../game.repository.interface";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class GetUserRoomUseCase {
    constructor(
        @Inject(GAME_REPOSITORY)
        private readonly gameRepository: IGameRepository,
    ) { }
    async execute(userId: string) {
        const roomId = await this.gameRepository.getUserRoom(userId);
        return roomId;
    }
}
