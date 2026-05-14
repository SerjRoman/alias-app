import { type EventEmitter2 } from "@nestjs/event-emitter";
import { type GameSharedService } from "../../game-shared.service";
import {
	PLAYERS_UPDATED,
	type PlayersUpdatedPayload,
	TEAMS_UPDATED,
	type TeamsUpdatedPayload,
} from "../../game.events";
import { type IGameRepository } from "../../game.repository.interface";
import { UserDto } from "@common/dto/user.dto";

export class LeaveGameUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(roomId: string, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(roomId);
		room.leaveGame(actor.id);
		await this.gameRepository.saveGame(room);
		await this.gameRepository.removeUserRoom(actor.id);
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
