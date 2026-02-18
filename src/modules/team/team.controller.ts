import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Delete,
	UseGuards,
} from "@nestjs/common";
import { TeamService } from "./team.service";
import { CreateTeamDto, GetAllTeamsDto, JoinTeamDto } from "./dto/body";
import { GetUserFromToken } from "../../common/decorators/get-user-from-token";
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
} from "@nestjs/swagger";
import type { UserFromToken } from "../../common/types/user-from-token";
import { JwtAuthGuard } from "../../common/guards/auth.guard";

@Controller("teams")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TeamController {
	constructor(private readonly teamService: TeamService) {}
	@Post()
	@ApiOperation({ summary: "Create a new team in a game room" })
	@ApiBody({ type: CreateTeamDto })
	create(
		@Body() createTeamDto: CreateTeamDto,
		@GetUserFromToken() user: UserFromToken,
	) {
		return this.teamService.createTeam(createTeamDto, user);
	}
	@Get(":roomId")
	@ApiOperation({ summary: "Get all teams in a game room" })
	@ApiParam({ name: "roomId", description: "The ID of the game room" })
	getAll(
		@Param() dto: GetAllTeamsDto,
		@GetUserFromToken() user: UserFromToken,
	) {
		console.log(user);
		return this.teamService.getAllTeams(dto, user);
	}
	@Post("join")
	@ApiOperation({ summary: "Join a team in a game room" })
	@ApiBody({ type: JoinTeamDto })
	joinTeam(
		@Body() { teamId, roomId }: JoinTeamDto,
		@GetUserFromToken() user: UserFromToken,
	) {
		return this.teamService.joinTeam({ roomId, teamId }, user);
	}

	@Delete(":teamId/rooms/:roomId")
	@ApiOperation({ summary: "Delete a team from a game room" })
	@ApiParam({ name: "teamId", description: "The ID of the team to delete" })
	@ApiParam({ name: "roomId", description: "The ID of the game room" })
	remove(
		@Param() { teamId, roomId }: { teamId: string; roomId: string },
		@GetUserFromToken() user: UserFromToken,
	) {
		return this.teamService.deleteTeam({ teamId, roomId }, user);
	}
}
