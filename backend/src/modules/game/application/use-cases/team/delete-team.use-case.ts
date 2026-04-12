import { type EventEmitter2 } from "@nestjs/event-emitter";
import { type GameSharedService } from "../../game-shared.service";
import { type TeamsUpdatedPayload, TEAMS_UPDATED } from "../../game.events";
import { type IGameRepository } from "../../game.repository.interface";
import { type DeleteTeamDto } from "../../../dto/body";

export class DeleteTeamUseCase {
	constructor(
		private readonly gameRepository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(dto: DeleteTeamDto, actorId: string) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.deleteTeam(actorId, dto.teamId);
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
