import { Inject, Injectable } from "@nestjs/common";
import { CreateGameDto } from "./dto/body/create-game.dto";
import { UserFromToken } from "../../../common/types/user-from-token";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../repository/game.repository.interface";
import {
	NotRoomOwnerError,
	RoomNotFoundError,
} from "../domain/errors/game.errors";
import { GameEntity, GameSettings } from "../domain/entities/game.entity";

@Injectable()
export class GameService {
	constructor(
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
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

		newRoom.addPlayer(user.id, user.name);
		await this.repository.save(newRoom);
		return newRoom.toPrimitives();
	}

	findAll() {
		return this.repository.findAll();
	}

	findOne(id: string) {
		return this.repository.findById(id);
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
	async joinGame(roomId: string, user: UserFromToken) {
		const room = await this.repository.findById(roomId);
		if (!room) throw new RoomNotFoundError(roomId);
		room.addPlayer(user.id, user.name);
		await this.repository.save(room);
		return room.toPrimitives();
	}
	async toggleReady(roomId: string, user: UserFromToken) {
		const room = await this.repository.findById(roomId);
		if (!room) throw new RoomNotFoundError(roomId);
		room.togglePlayerReady(user.id);
		await this.repository.save(room);
		return room.toPrimitives();
	}
	async toggleRoundReady(roomId: string, user: UserFromToken) {
		const room = await this.repository.findById(roomId);
		if (!room) throw new RoomNotFoundError(roomId);
		room.togglePlayerRoundReady(user.id);
		await this.repository.save(room);
		return room.toPrimitives();
	}
}
