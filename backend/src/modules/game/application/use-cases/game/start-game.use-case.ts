import { type EventEmitter2 } from "@nestjs/event-emitter";
import { type GameSharedService } from "../../game-shared.service";
import { type IGameRepository } from "../../game.repository.interface";
import type { DictionaryService } from "../../dictionary.service";
import { GAME_STARTED, type GameStartedPayload } from "../../game.events";

export class StartGameUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
		private readonly dictionaryService: DictionaryService,
	) {}
	async execute(roomId: string, actorId: string) {
		const room = await this.gameSharedService.loadGame(roomId);
		await this.dictionaryService.setWordsForGame(
			roomId,
			100,
			room.settings.level,
		);
		room.startGame(actorId);
		room.createRound();
		await this.gameRepository.saveGame(room);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: GameStartedPayload = {
			room: roomPrimitives,
		};
		this.eventEmitter.emit(GAME_STARTED, eventPayload);
		return roomPrimitives;
	}
}
