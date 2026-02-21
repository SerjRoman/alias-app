import { Inject, Injectable } from "@nestjs/common";
import { CreateGameDto } from "./dto/body/create-game.dto";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../repository/game.repository.interface";
import {
	GameError,
	InvalidGameCode,
	NotRoomOwnerError,
	RoomNotFoundError,
} from "../domain/errors/game.errors";
import { GameEntity, GameSettings } from "../domain/entities/game.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
	GAME_STARTED,
	GAME_UPDATED,
	GameStartedPayload,
	GameUpdatedPayload,
	PLAYERS_UPDATED,
	PlayersUpdatedPayload,
	TEAMS_UPDATED,
	TeamsUpdatedPayload,
} from "../events/game.events";
import {
	CreateTeamDto,
	DeleteTeamDto,
	GetRoomCodeDto,
	JoinGameDto,
	KickPlayerDto,
	MoveToTeamDto,
	PlayerLeftRoomDto,
	UpdateGameSettingsDto,
} from "./dto/body";
import { UserDto } from "../../auth/dto/user.dto";

@Injectable()
export class GameService {
	constructor(
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}
	private generateRoomCode(length: number): string {
		let result = "";
		const characters = "0123456789";
		for (let i = 0; i < length; i++) {
			result += characters.charAt(
				Math.floor(Math.random() * characters.length),
			);
		}
		return result;
	}
	async create(createGameDto: CreateGameDto, user: UserDto) {
		const code = createGameDto.isPrivate ? this.generateRoomCode(6) : null;
		const settings: GameSettings = {
			name: createGameDto.name,
			roundTimeSeconds: createGameDto.timeLimit,
			pointsToWin: createGameDto.pointsToWin,
			code: code,
			isPrivate: createGameDto.isPrivate || false,
		};
		const newRoom = GameEntity.create(user.id, settings);

		await this.repository.save(newRoom);
		return { room: newRoom.toPrimitives(), code };
	}

	async findAll() {
		return (await this.repository.findAll()).map((g) => g.toPrimitives());
	}

	async findOne(id: string) {
		return (await this.repository.findById(id))?.toPrimitives();
	}

	async delete(id: string, user: UserDto) {
		const room = await this.repository.findById(id);
		if (!room) throw new RoomNotFoundError(id);
		if (room.ownerId !== user.id) throw new NotRoomOwnerError();
		return this.repository.delete(id);
	}
	async validateCode(roomId: string, code?: string): Promise<boolean> {
		const room = await this.repository.findById(roomId);
		if (!room) throw new RoomNotFoundError(roomId);
		if (!room.settings.code || !room.settings.isPrivate) return true;
		return room.settings.code === code;
	}
	async joinGame(dto: JoinGameDto, user: UserDto) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (room.settings.isPrivate && room.settings.code) {
			if (!(await this.validateCode(dto.roomId, dto.code)))
				throw new InvalidGameCode();
		}
		room.addPlayer(user.id, user.name);
		await this.repository.save(room);
		await this.repository.setUserRoom(user.id, room.id);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: GameUpdatedPayload = {
			room: roomPrimitives,
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);
		return roomPrimitives;
	}
	async toggleReady(roomId: string, user: UserDto) {
		const room = await this.repository.findById(roomId);
		if (!room) throw new RoomNotFoundError(roomId);
		room.togglePlayerReady(user.id);
		await this.repository.save(room);
		const eventPayload: PlayersUpdatedPayload = {
			roomId: room.id,
			players: room.players.map((p) => p.toPrimitives()),
		};
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayload);
		return room.toPrimitives();
	}
	async toggleRoundReady(roomId: string, user: UserDto) {
		const room = await this.repository.findById(roomId);
		if (!room) throw new RoomNotFoundError(roomId);
		room.togglePlayerRoundReady(user.id);
		await this.repository.save(room);
		const eventPayload: PlayersUpdatedPayload = {
			roomId: room.id,
			players: room.players.map((p) => p.toPrimitives()),
		};
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayload);
		return room.toPrimitives();
	}
	async playerLeftRoom(dto: PlayerLeftRoomDto) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		room.removePlayer(dto.playerId);
		await this.repository.save(room);
		await this.repository.removeUserRoom(dto.playerId);
		const roomPrimitives = room.toPrimitives();
		const eventPayloadTeams: TeamsUpdatedPayload = {
			roomId: room.id,
			teams: roomPrimitives.teams,
		};
		const eventPayloadPlayers: PlayersUpdatedPayload = {
			roomId: room.id,
			players: roomPrimitives.players,
		};
		this.eventEmitter.emit(TEAMS_UPDATED, eventPayloadTeams);
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayloadPlayers);
		return room.toPrimitives();
	}
	async kickPlayer(dto: KickPlayerDto, user: UserDto) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (room.ownerId !== user.id) throw new NotRoomOwnerError();
		if (room.ownerId === dto.playerId)
			throw new GameError("Owner cannot kick himself");
		const roomPrimitives = await this.playerLeftRoom({
			roomId: dto.roomId,
			playerId: dto.playerId,
		});
		return roomPrimitives;
	}
	async updateGameSettings(dto: UpdateGameSettingsDto, user: UserDto) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (room.ownerId !== user.id) throw new NotRoomOwnerError();
		room.updateSettings(dto);
		await this.repository.save(room);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: GameUpdatedPayload = {
			room: roomPrimitives,
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);
		return roomPrimitives;
	}
	async startGame(roomId: string, user: UserDto) {
		const room = await this.repository.findById(roomId);
		if (!room) throw new RoomNotFoundError(roomId);
		if (room.ownerId !== user.id) throw new NotRoomOwnerError();
		room.startGame();
		await this.repository.save(room);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: GameStartedPayload = {
			room: roomPrimitives,
		};
		this.eventEmitter.emit(GAME_STARTED, eventPayload);
		return roomPrimitives;
	}
	async moveToTeam(dto: MoveToTeamDto, user: UserDto) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		room.movePlayerToTeam(user.id, dto.teamId);
		await this.repository.save(room);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: TeamsUpdatedPayload = {
			roomId: room.id,
			teams: roomPrimitives.teams,
		};
		this.eventEmitter.emit(TEAMS_UPDATED, eventPayload);
		return roomPrimitives;
	}
	async deleteTeam(dto: DeleteTeamDto, user: UserDto) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (room.ownerId !== user.id) throw new NotRoomOwnerError();
		room.deleteTeam(dto.teamId);
		await this.repository.save(room);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: TeamsUpdatedPayload = {
			roomId: room.id,
			teams: roomPrimitives.teams,
		};
		this.eventEmitter.emit(TEAMS_UPDATED, eventPayload);
		return room.toPrimitives();
	}
	async createTeam(dto: CreateTeamDto, user: UserDto) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (room.ownerId !== user.id) throw new NotRoomOwnerError();
		room.createTeam(dto.teamName);
		await this.repository.save(room);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: TeamsUpdatedPayload = {
			roomId: room.id,
			teams: roomPrimitives.teams,
		};
		this.eventEmitter.emit(TEAMS_UPDATED, eventPayload);
		return roomPrimitives;
	}
	async getRoomCode(dto: GetRoomCodeDto, user: UserDto) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (room.ownerId !== user.id) throw new NotRoomOwnerError();
		return { code: room.settings.code };
	}
	async getCurrentGameId(userId: string) {
		const roomId = await this.repository.getUserRoom(userId);
		if (roomId) {
			const room = await this.repository.findById(roomId);
			if (!room) {
				await this.repository.removeUserRoom(userId);
				return { roomId: null };
			}
		}
		return { roomId };
	}
}
