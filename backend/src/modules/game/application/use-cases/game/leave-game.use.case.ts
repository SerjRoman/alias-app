import { type EventEmitter2 } from "@nestjs/event-emitter";
import { type GameSharedService } from "../../game-shared.service";
import {
	PLAYERS_UPDATED,
	type PlayersUpdatedPayload,
	TEAMS_UPDATED,
	type TeamsUpdatedPayload,
} from "../../game.events";
import { type IGameRepository } from "../../game.repository.interface";

export class LeaveGameUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(roomId: string, playerId: string) {
		const room = await this.gameSharedService.loadGame(roomId);
		room.leaveGame(playerId);
		await this.gameRepository.saveGame(room);
		await this.gameRepository.removeUserRoom(playerId);
		const roomPrimitives = room.toPrimitives();
		const eventPayloadTeams: TeamsUpdatedPayload = {
			roomId: room.id,
			teams: roomPrimitives.teams,
		};
		const eventPayloadPlayers: PlayersUpdatedPayload = {
			roomId: room.id,
			players: roomPrimitives.players,
		};
		this.eventEmitter.emit(TEAMS_UPDATED, eventPayloadTeams);
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayloadPlayers);
		return room.toPrimitives();
	}
}
