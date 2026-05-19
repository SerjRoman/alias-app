import { UserDto } from "@common/dto/user.dto";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class DeleteGameUseCase {
	constructor(
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
	) {}
	async execute(gameId: string, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(gameId);
		room.assertRoomOwner(actor.id);
		return this.gameRepository.deleteGame(gameId);
	}
}
