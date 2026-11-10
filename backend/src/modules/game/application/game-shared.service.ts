import { Inject, Injectable } from "@nestjs/common";
import { GameEngine } from "../domain/engine/game-engine";
import { RoomNotFoundError } from "../domain/errors/game.errors";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "./game.repository.interface";

@Injectable()
export class GameSharedService {
	constructor(
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
	) {}

	public async loadGame(gameId: string): Promise<GameEngine> {
		const game = await this.repository.findGameById(gameId);
		if (!game) throw new RoomNotFoundError(gameId);
		return game;
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
		const settings = room.getState().settings;
		if (!settings?.code || !settings?.isPrivate) return true;
		return settings.code === code;
	}
}
