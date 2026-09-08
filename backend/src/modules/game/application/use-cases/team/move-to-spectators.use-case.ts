import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameSharedService } from "../../game-shared.service";
import {
	GAME_UPDATED,
	PLAYERS_UPDATED,
	TEAMS_UPDATED,
	type GameUpdatedPayload,
	type PlayersUpdatedPayload,
	type TeamsUpdatedPayload,
} from "../../game.events";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { MoveToSpectatorsDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class MoveToSpectatorsUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
	) {}
	async execute(dto: MoveToSpectatorsDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		if (dto.playerId) {
			room.moveToSpectators(dto.playerId, actor.id);
		} else {
			room.moveToSpectators(actor.id);
		}

		await this.gameRepository.saveGame(room);
		const roomPrimitives = room.toPrimitives();

		const eventPayloadTeams: TeamsUpdatedPayload = {
			roomId: room.id,
			teams: roomPrimitives.teams,
		};
		const eventPayloadPlayers: PlayersUpdatedPayload = {
			roomId: room.id,
			players: roomPrimitives.players,
		};
		const eventPayloadGame: GameUpdatedPayload = {
			room: roomPrimitives,
		};

		this.eventEmitter.emit(TEAMS_UPDATED, eventPayloadTeams);
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayloadPlayers);
		this.eventEmitter.emit(GAME_UPDATED, eventPayloadGame);

		return roomPrimitives;
	}
}
