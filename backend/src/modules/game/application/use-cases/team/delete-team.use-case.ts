import { type EventEmitter2 } from "@nestjs/event-emitter";
import { type GameSharedService } from "../../game-shared.service";
import { type TeamsUpdatedPayload, TEAMS_UPDATED } from "../../game.events";
import { type IGameRepository } from "../../game.repository.interface";
import { DeleteTeamDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";

export class DeleteTeamUseCase {
	constructor(
		private readonly gameRepository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(dto: DeleteTeamDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.deleteTeam(actor.id, dto.teamId);
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
