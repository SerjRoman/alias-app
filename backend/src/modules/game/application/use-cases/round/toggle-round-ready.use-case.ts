import { type EventEmitter2 } from "@nestjs/event-emitter";
import { type GameSharedService } from "../game-shared.service";
import { type PlayersUpdatedPayload, PLAYERS_UPDATED } from "../game.events";
import { type IGameRepository } from "../game.repository.interface";

export class ToggleRoundReadyUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
		private readonly repository: IGameRepository,
	) {}
	async execute(roomId: string, playerId: string) {
		const room = await this.gameSharedService.loadGame(roomId);
		room.togglePlayerRoundReady(playerId);
		await this.repository.saveGame(room);
		const eventPayload: PlayersUpdatedPayload = {
			roomId: room.id,
			players: room.players.map((p) => p.toPrimitives()),
		};
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayload);
		return room.toPrimitives();
	}
}
