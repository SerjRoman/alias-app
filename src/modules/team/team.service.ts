import { Inject, Injectable } from "@nestjs/common";
import {
	RoomNotFoundError,
	NotRoomOwnerError,
	NotInGameError,
} from "../game/domain/errors/game.errors";
import { UserFromToken } from "../../common/types/user-from-token";
import {
	CreateTeamDto,
	DeleteTeamDto,
	GetAllTeamsDto,
	JoinTeamDto,
} from "./dto/body";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../game/repository/game.repository.interface";

@Injectable()
export class TeamService {
	constructor(
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
	) {}

	async createTeam(createTeamDto: CreateTeamDto, user: UserFromToken) {
		const room = await this.repository.findById(createTeamDto.roomId);
		if (!room) throw new RoomNotFoundError(createTeamDto.roomId);
		if (room.ownerId !== user.id) throw new NotRoomOwnerError();

		const newTeam = room.createTeam(createTeamDto.teamName);
		await this.repository.save(room);
		return newTeam.toPrimitives();
	}
	async getAllTeams(dto: GetAllTeamsDto, user: UserFromToken) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (!room.players.some((p) => p.id === user.id))
			throw new NotInGameError();
		return room.teams.map((t) => t.toPrimitives());
	}
	async joinTeam(dto: JoinTeamDto, user: UserFromToken) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		room.movePlayerToTeam(user.id, dto.teamId);
		await this.repository.save(room);
		return room.toPrimitives();
	}
	async deleteTeam(dto: DeleteTeamDto, user: UserFromToken) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (room.ownerId !== user.id) throw new NotRoomOwnerError();
		room.deleteTeam(dto.teamId);
		await this.repository.save(room);
		return room.toPrimitives();
	}
}
