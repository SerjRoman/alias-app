import { Injectable } from "@nestjs/common";
import { CreateTeamUseCase } from "../use-cases/team/create-team.use-case";
import { DeleteTeamUseCase } from "../use-cases/team/delete-team.use-case";
import { MoveToTeamUseCase } from "../use-cases/team/move-to-team.use-case";
import { UserDto } from "@common/dto/user.dto";
import { CreateTeamDto, MoveToTeamDto, DeleteTeamDto } from "../dto/body";

@Injectable()
export class TeamFacade {
	constructor(
		private readonly createTeamUseCase: CreateTeamUseCase,
		private readonly moveToTeamUseCase: MoveToTeamUseCase,
		private readonly deleteTeamUseCase: DeleteTeamUseCase,
	) {}

	async createTeam(dto: CreateTeamDto, actor: UserDto) {
		return this.createTeamUseCase.execute(dto, actor);
	}

	async moveToTeam(dto: MoveToTeamDto, actor: UserDto) {
		return this.moveToTeamUseCase.execute(dto, actor);
	}

	async deleteTeam(dto: DeleteTeamDto, actor: UserDto) {
		return this.deleteTeamUseCase.execute(dto, actor);
	}
}
