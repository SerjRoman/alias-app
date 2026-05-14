import { type EventEmitter2 } from "@nestjs/event-emitter";
import { type GameSharedService } from "../../game-shared.service";
import {
	type PlayerKickedPayload,
	type TeamsUpdatedPayload,
	type PlayersUpdatedPayload,
	PLAYER_KICKED,
	TEAMS_UPDATED,
	PLAYERS_UPDATED,
} from "../../game.events";
import { type IGameRepository } from "../../game.repository.interface";
import { KickPlayerDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";

export class KickPlayerUseCase {
	constructor(
		private readonly gameRepository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(dto: KickPlayerDto, roomId: string, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(roomId);
		room.kickPlayer(actor.id, dto.playerId);
		await this.gameRepository.saveGame(room);
		await this.gameRepository.removeUserRoom(dto.playerId);
		const roomPrimitives = room.toPrimitives();

		const eventPayload: PlayerKickedPayload = {
			kickedUserId: dto.playerId,
			roomId: room.id,
		};
		const eventPayloadTeams: TeamsUpdatedPayload = {
			roomId: room.id,
			teams: roomPrimitives.teams,
		};
		const eventPayloadPlayers: PlayersUpdatedPayload = {
			roomId: room.id,
			players: roomPrimitives.players,
		};
		this.eventEmitter.emit(PLAYER_KICKED, eventPayload);

		this.eventEmitter.emit(TEAMS_UPDATED, eventPayloadTeams);
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayloadPlayers);
		return roomPrimitives;
	}
}
