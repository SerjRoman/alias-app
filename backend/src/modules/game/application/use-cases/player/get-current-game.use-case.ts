import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class GetCurrentGameUseCase {
	constructor(
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
	) {}

	async execute(userId: string) {
		const roomId = await this.gameRepository.getUserRoom(userId);
		if (!roomId) {
			return { roomId: null, code: null };
		}
		const game = await this.gameRepository.findGameById(roomId);
		if (!game) {
			await this.gameRepository.removeUserRoom(userId);
			return { roomId: null, code: null };
		}
		const isUserInGame = game.players.some((p) => p.id === userId);
		if (!isUserInGame) {
			await this.gameRepository.removeUserRoom(userId);
			return { roomId: null, code: null };
		}
		return {
			roomId,
			code: game.settings.code || null,
		};
	}
}
