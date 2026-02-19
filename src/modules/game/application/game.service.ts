import { Inject, Injectable } from "@nestjs/common";
import { CreateGameDto } from "./dto/body/create-game.dto";
import { UserFromToken } from "../../../common/types/user-from-token";
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
	PLAYER_GAME_READY_UPDATE,
	PLAYER_KICKED,
	PLAYER_ROUND_READY_UPDATE,
	PlayerGameReadyPayload,
	PlayerKickedPayload,
	PlayerRoundReadyPayload,
	TEAMS_UPDATED,
	TeamsUpdatedPayload,
} from "../events/game.events";
import {
	CreateTeamDto,
	DeleteTeamDto,
	JoinGameDto,
	KickPlayerDto,
	MoveToTeamDto,
	UpdateGameSettingsDto,
} from "./dto/body";

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
	async create(createGameDto: CreateGameDto, user: UserFromToken) {
		const code = createGameDto.isPrivate ? this.generateRoomCode(6) : null;
		const settings: GameSettings = {
			roundTimeSeconds: createGameDto.timeLimit,
			pointsToWin: createGameDto.pointsToWin,
			roomName: createGameDto.name,
			code: code,
			isPrivate: createGameDto.isPrivate || false,
		};
		const newRoom = GameEntity.create(user.id, settings);

		await this.repository.save(newRoom);
		return newRoom.toPrimitives();
	}

	async findAll() {
		return (await this.repository.findAll()).map((g) => g.toPrimitives());
	}

	async findOne(id: string) {
		return (await this.repository.findById(id))?.toPrimitives();
	}

	async delete(id: string, user: UserFromToken) {
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
	async joinGame(dto: JoinGameDto, user: UserFromToken) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (room.settings.isPrivate && room.settings.code) {
			if (room.settings.code !== dto.code) throw new InvalidGameCode();
		}
		room.addPlayer(user.id, user.name);
		await this.repository.save(room);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: GameUpdatedPayload = {
			room: roomPrimitives,
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);
		return roomPrimitives;
	}
	async toggleReady(roomId: string, user: UserFromToken) {
		const room = await this.repository.findById(roomId);
		if (!room) throw new RoomNotFoundError(roomId);
		room.togglePlayerReady(user.id);
		await this.repository.save(room);
		const eventPayload: PlayerGameReadyPayload = {
			roomId: room.id,
			player: room.players.find((p) => p.id === user.id)!.toPrimitives(),
		};
		this.eventEmitter.emit(PLAYER_GAME_READY_UPDATE, eventPayload);
		return room.toPrimitives();
	}
	async toggleRoundReady(roomId: string, user: UserFromToken) {
		const room = await this.repository.findById(roomId);
		if (!room) throw new RoomNotFoundError(roomId);
		room.togglePlayerRoundReady(user.id);
		await this.repository.save(room);
		const eventPayload: PlayerRoundReadyPayload = {
			roomId: room.id,
			player: room.players.find((p) => p.id === user.id)!.toPrimitives(),
		};
		this.eventEmitter.emit(PLAYER_ROUND_READY_UPDATE, eventPayload);
		return room.toPrimitives();
	}
	async kickPlayer(dto: KickPlayerDto, user: UserFromToken) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (room.ownerId !== user.id) throw new NotRoomOwnerError();
		if (room.ownerId === dto.playerId)
			throw new GameError("Owner cannot kick himself");
		room.removePlayer(dto.playerId);
		await this.repository.save(room);
		const eventPayload: PlayerKickedPayload = {
			roomId: room.id,
			playerId: dto.playerId,
		};
		this.eventEmitter.emit(PLAYER_KICKED, eventPayload);
		return room.toPrimitives();
	}
	async updateGameSettings(dto: UpdateGameSettingsDto, user: UserFromToken) {
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
	async startGame(roomId: string, user: UserFromToken) {
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
	async moveToTeam(dto: MoveToTeamDto, user: UserFromToken) {
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
	async deleteTeam(dto: DeleteTeamDto, user: UserFromToken) {
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
	async createTeam(dto: CreateTeamDto, user: UserFromToken) {
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
}
