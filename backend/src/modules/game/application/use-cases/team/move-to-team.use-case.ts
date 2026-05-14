import { type EventEmitter2 } from "@nestjs/event-emitter";
import { type GameSharedService } from "../../game-shared.service";
import { TEAMS_UPDATED, type TeamsUpdatedPayload } from "../../game.events";
import { type IGameRepository } from "../../game.repository.interface";
import { MoveToTeamDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";

export class MoveToTeamUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
		private readonly gameRepository: IGameRepository,
	) {}
	async execute(dto: MoveToTeamDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		if (dto.playerId) {
			room.movePlayerToTeam(dto.playerId, dto.teamId, actor.id);
		} else {
			room.movePlayerToTeam(actor.id, dto.teamId);
		}

		await this.gameRepository.saveGame(room);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: TeamsUpdatedPayload = {
			roomId: room.id,
			teams: roomPrimitives.teams,
		};
		this.eventEmitter.emit(TEAMS_UPDATED, eventPayload);
		return roomPrimitives;
	}
}
