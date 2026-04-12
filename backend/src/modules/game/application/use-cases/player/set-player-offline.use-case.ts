import { type EventEmitter2 } from "@nestjs/event-emitter";
import { type GameSharedService } from "../game-shared.service";
import { type PlayersUpdatedPayload, PLAYERS_UPDATED } from "../game.events";
import { type IGameRepository } from "../game.repository.interface";

export class SetPlayerOfflineUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly repository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(roomId: string, actorId: string) {
		const room = await this.gameSharedService.loadGame(roomId);
		room.setPlayerOffline(actorId);
		const players = await this.repository.findPlayersByGameId(
			roomId,
			room.players.map((p) => p.id),
		);
		await this.repository.saveGame(room);
		const eventPayload: PlayersUpdatedPayload = {
			players: players.map((p) => p.toPrimitives()),
			roomId: room.id,
		};
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayload);
	}
}
