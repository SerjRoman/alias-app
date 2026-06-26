import { Inject, Injectable } from "@nestjs/common";
import { GameEntity } from "../domain/entities/game.entity";
import { GameError, RoomNotFoundError } from "../domain/errors/game.errors";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "./game.repository.interface";
import { DictionaryService } from "./dictionary.service";

@Injectable()
export class GameSharedService {
	constructor(
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
		private readonly dictionaryService: DictionaryService,
	) {}
	public async loadGame(gameId: string): Promise<GameEntity> {
		const game = await this.repository.findGameById(gameId);
		if (!game) throw new RoomNotFoundError(gameId);
		return game;
	}

	public async getWordForGameSession(room: GameEntity) {
		const text = await this.dictionaryService.getLastWordForGame(room.id);
		if (!text) {
			throw new GameError(
				"Unexpected error: no words available for the game",
			);
		}
		return text;
	}

	public generateRoomCode(length: number): string {
		let result = "";
		const characters = "0123456789";
		for (let i = 0; i < length; i++) {
			result += characters.charAt(
				Math.floor(Math.random() * characters.length),
			);
		}
		return result;
	}
	async validateCode(roomId: string, code?: string): Promise<boolean> {
		const room = await this.loadGame(roomId);
		if (!room.settings.code || !room.settings.isPrivate) return true;
		return room.settings.code === code;
	}
}
