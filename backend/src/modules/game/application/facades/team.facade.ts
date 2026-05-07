import { Injectable } from "@nestjs/common";
import { type UserDto } from "../../../user/application/dto/user.dto";
import {
    type CreateTeamDto,
    type DeleteTeamDto,
    type MoveToTeamDto,
} from "../../dto/body";
import { CreateTeamUseCase } from "../use-cases/team/create-team.use-case";
import { DeleteTeamUseCase } from "../use-cases/team/delete-team.use-case";
import { MoveToTeamUseCase } from "../use-cases/team/move-to-team.use-case";

@Injectable()
export class TeamFacade {
    constructor(
        private readonly createTeamUseCase: CreateTeamUseCase,
        private readonly moveToTeamUseCase: MoveToTeamUseCase,
        private readonly deleteTeamUseCase: DeleteTeamUseCase,
    ) { }

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
