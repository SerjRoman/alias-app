import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { type UserDto } from "../../../auth/dto/user.dto";
import {
	type CreateTeamDto,
	type DeleteTeamDto,
	type MoveToTeamDto,
} from "../../dto/body";
import { GameSharedService } from "../game-shared.service";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../game.repository.interface";
import { CreateTeamUseCase } from "../use-cases/team/create-team.use-case";
import { DeleteTeamUseCase } from "../use-cases/team/delete-team.use-case";
import { MoveToTeamUseCase } from "../use-cases/team/move-to-team.use-case";

@Injectable()
export class TeamFacade {
	private readonly createTeamUseCase: CreateTeamUseCase;
	private readonly moveToTeamUseCase: MoveToTeamUseCase;
	private readonly deleteTeamUseCase: DeleteTeamUseCase;

	constructor(
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
	) {
		this.createTeamUseCase = new CreateTeamUseCase(
			this.gameSharedService,
			this.repository,
			this.eventEmitter,
		);
		this.moveToTeamUseCase = new MoveToTeamUseCase(
			this.gameSharedService,
			this.eventEmitter,
			this.repository,
		);
		this.deleteTeamUseCase = new DeleteTeamUseCase(
			this.repository,
			this.gameSharedService,
			this.eventEmitter,
		);
	}

	async createTeam(dto: CreateTeamDto, actor: UserDto) {
		return this.createTeamUseCase.execute(dto, actor.id);
	}

	async moveToTeam(dto: MoveToTeamDto, actor: UserDto) {
		return this.moveToTeamUseCase.execute(dto, actor.id);
	}

	async deleteTeam(dto: DeleteTeamDto, actor: UserDto) {
		return this.deleteTeamUseCase.execute(dto, actor.id);
	}
}
