import { type EventEmitter2 } from "@nestjs/event-emitter";
import { type GameSharedService } from "../../game-shared.service";
import { type TeamsUpdatedPayload, TEAMS_UPDATED } from "../../game.events";
import { type IGameRepository } from "../../game.repository.interface";
import { type CreateTeamDto } from "../../../dto/body";

export class CreateTeamUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly repository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(dto: CreateTeamDto, actorId: string) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.createTeam(actorId, dto.teamName);
		await this.repository.saveGame(room);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: TeamsUpdatedPayload = {
			roomId: room.id,
			teams: roomPrimitives.teams,
		};
		this.eventEmitter.emit(TEAMS_UPDATED, eventPayload);
		return roomPrimitives;
	}
}
