import { Inject, Injectable } from "@nestjs/common";
import { GameEntity } from "../domain/entities/game.entity";
import { GameError, RoomNotFoundError } from "../domain/errors/game.errors";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "./game.repository.interface";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SchedulerRegistry } from "@nestjs/schedule";
import { DictionaryService } from "./dictionary.service";
import { RoundEntity } from "../domain/entities/round.entity";
import { RoundNotActiveError } from "../domain/errors/round.errors";

@Injectable()
export class GameSharedService {
	constructor(
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
		private readonly schedulerRegistry: SchedulerRegistry,
		private readonly dictionaryService: DictionaryService,
	) {}
	public async loadGame(gameId: string): Promise<GameEntity> {
		const game = await this.repository.findGameById(gameId);
		if (!game) throw new RoomNotFoundError(gameId);
		return game;
	}
	public async loadRound(game: GameEntity): Promise<RoundEntity> {
		if (!game.currentRound) {
			throw new RoundNotActiveError();
		}
		const round = await this.repository.findRoundById(game.currentRound.id);
		if (!round)
			throw new GameError(
				`Round with id ${game.currentRound.id} not found`,
			);
		return round;
	}
	public async getWordForGameSession(room: GameEntity) {
		let text: string | null = this.dictionaryService.getLastWordForGame(
			room.id,
		);
		if (!text) {
			await this.dictionaryService.setWordsForGame(
				room.id,
				100,
				room.settings.level,
			);
		}
		text = this.dictionaryService.getLastWordForGame(room.id);
		if (!text) {
			throw new GameError(
				"Unexpected error: no words available for the game",
			);
		}
		return text;
	}

	public async checkAndSetWordsForGame(room: GameEntity) {
		if (this.dictionaryService.getWordsForGame(room.id).length < 10) {
			await this.dictionaryService.setWordsForGame(
				room.id,
				100,
				room.settings.level,
			);
		}
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
