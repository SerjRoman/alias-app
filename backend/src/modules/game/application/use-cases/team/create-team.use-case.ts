import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameSharedService } from "../../game-shared.service";
import { type TeamsUpdatedPayload, TEAMS_UPDATED } from "../../game.events";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { CreateTeamDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class CreateTeamUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		private readonly repository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(dto: CreateTeamDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.createTeam(actor.id, dto.teamName);
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
