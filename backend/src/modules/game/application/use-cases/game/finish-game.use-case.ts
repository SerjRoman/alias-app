import { UserDto } from "@common/dto/user.dto";
import { type GameSharedService } from "../../game-shared.service";
import { type IGameRepository } from "../../game.repository.interface";

export class FinishGameUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly gameRepository: IGameRepository,
	) {}
	async execute(roomId: string, actor?: UserDto) {
		const room = await this.gameSharedService.loadGame(roomId);
		room.finishGame(actor?.id);
		await this.gameRepository.saveGame(room);
		return room.toPrimitives();
	}
}
