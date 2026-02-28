import { Inject, Injectable, Logger } from "@nestjs/common";
import { CreateGameDto } from "./dto/body/create-game.dto";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../repository/game.repository.interface";
import {
	GameError,
	GameNotFinishedError,
	InvalidGameCode,
	NotRoomOwnerError,
	RoomNotFoundError,
} from "../domain/errors/game.errors";
import {
	GameEntity,
	GameSettings,
	GameStatus,
} from "../domain/entities/game.entity";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
	GAME_FINISHED,
	GAME_STARTED,
	GAME_UPDATED,
	GameFinishedPayload,
	type GameStartedPayload,
	type GameUpdatedPayload,
	PLAYER_KICKED,
	type PlayerKickedPayload,
	PLAYERS_UPDATED,
	type PlayersUpdatedPayload,
	ROUND_UPDATED,
	type RoundUpdatedPayload,
	TEAMS_UPDATED,
	type TeamsUpdatedPayload,
} from "../events/game.events";
import {
	ChangeWordScoreDto,
	CreateTeamDto,
	DeleteGameDto,
	DeleteTeamDto,
	GetRoomCodeDto,
	JoinGameDto,
	KickPlayerDto,
	MoveToTeamDto,
	NextRoundDto,
	NextWordDto,
	PlayerLeftRoomDto,
	StartRoundDto,
	UpdateGameSettingsDto,
} from "./dto/body";
import { UserDto } from "../../auth/dto/user.dto";
import { SchedulerRegistry } from "@nestjs/schedule";
import {
	RoundAlreadyStarted,
	RoundIsNotFinished,
	RoundNotActiveError,
	UserIsNotGuesser,
} from "../domain/errors/round.errors";
import { RoundStatus } from "../domain/entities/round.entity";
import { DictionaryService } from "./dictionary.service";

@Injectable()
export class GameService {
	private readonly logger = new Logger(GameService.name);

	constructor(
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
		private readonly schedulerRegistry: SchedulerRegistry,
		private readonly dictionaryService: DictionaryService,
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
			level: createGameDto.level,
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
	async setPlayerOffline(roomId: string, playerId: string) {
		const room = await this.repository.findById(roomId);
		if (!room) throw new RoomNotFoundError(roomId);
		room.setPlayerOffline(playerId);
		await this.repository.save(room);
		const eventPayload: PlayersUpdatedPayload = {
			players: room.players.map((p) => p.toPrimitives()),
			roomId: room.id,
		};
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayload);
	}

	async joinGame(dto: JoinGameDto, user: UserDto) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (room.settings.isPrivate && room.settings.code) {
			if (!(await this.validateCode(dto.roomId, dto.code)))
				throw new InvalidGameCode();
		}
		const existingPlayer = room.players.find((p) => p.id === user.id);

		if (existingPlayer) {
			room.setPlayerOnline(existingPlayer.id);
		} else {
			room.addPlayer(user.id, user.name);
		}

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
		const eventPayload: PlayerKickedPayload = {
			kickedUserId: dto.playerId,
			roomId: room.id,
		};
		this.eventEmitter.emit(PLAYER_KICKED, eventPayload);
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
		await this.dictionaryService.setWordsForGame(
			roomId,
			100,
			room.settings.level,
		);
		room.startGame();
		room.createRound();
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
		const targetPlayerId = dto.playerId || user.id;
		if (targetPlayerId !== user.id) {
			if (room.ownerId !== user.id) {
				throw new NotRoomOwnerError();
			}
		}
		room.movePlayerToTeam(targetPlayerId, dto.teamId);
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
	async startRound(dto: StartRoundDto, user: UserDto) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (!room.currentRound) throw new RoundNotActiveError();
		if (room.currentRound.status !== RoundStatus.PENDING)
			throw new RoundAlreadyStarted();
		if (room.currentRound.guesserId !== user.id)
			throw new UserIsNotGuesser(user.id);
		const startTime = Date.now();
		room.startRound(startTime);
		this.scheduleRoundTimeout(
			room.id,
			room.settings.roundTimeSeconds * 1000,
		);
		let text: string | null = this.dictionaryService.getWordForGame(
			room.id,
		);
		if (!text) {
			await this.dictionaryService.setWordsForGame(
				room.id,
				100,
				room.settings.level,
			);
		}
		text =
			this.dictionaryService.getWordForGame(room.id) ||
			"Шанс что прокнет 0";

		if (this.dictionaryService.getWordsForGame(room.id).length < 10) {
			await this.dictionaryService.setWordsForGame(
				room.id,
				100,
				room.settings.level,
			);
		}
		const word = room.nextWord(text, false);

		await this.repository.save(room);

		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
		return { word };
	}
	async finishRound(roomId: string) {
		const room = await this.repository.findById(roomId);
		if (!room) throw new RoomNotFoundError(roomId);
		if (!room.currentRound) throw new RoundNotActiveError();
		this.dictionaryService.removeWordsForGame(
			roomId,
			room.currentRound.words.map((w) => w.text),
		);
		if (this.dictionaryService.getWordsForGame(roomId).length < 10) {
			await this.dictionaryService.setWordsForGame(
				roomId,
				100,
				room.settings.level,
			);
		}

		room.finishRound();
		this.clearRoundTimeout(roomId);

		await this.repository.save(room);

		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
	}
	async nextRound(dto: NextRoundDto, user: UserDto) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (room.ownerId !== user.id) throw new NotRoomOwnerError();
		room.calculateRoundPoints();
		if (room.status === GameStatus.FINISHED) {
			this.scheduleGameDeletion(room.id, 24 * 60 * 60 * 1000);
		}
		room.createRound();
		await this.repository.save(room);
		const eventPayload: GameUpdatedPayload = {
			room: room.toPrimitives(),
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);
	}
	async nextWord(dto: NextWordDto, user: UserDto) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (!room.currentRound) throw new RoundNotActiveError();
		if (room.currentRound.status !== RoundStatus.IN_PROGRESS)
			throw new RoundAlreadyStarted();
		if (room.currentRound.guesserId !== user.id)
			throw new UserIsNotGuesser(user.id);
		let text: string | null = this.dictionaryService.getWordForGame(
			room.id,
		);
		if (!text) {
			await this.dictionaryService.setWordsForGame(
				room.id,
				100,
				room.settings.level,
			);
		}
		text =
			this.dictionaryService.getWordForGame(room.id) ||
			"Шанс что прокнет 0";

		const newWord = room.nextWord(text, dto.wasSkipped);
		if (this.dictionaryService.getWordsForGame(room.id).length < 10) {
			await this.dictionaryService.setWordsForGame(
				room.id,
				100,
				room.settings.level,
			);
		}
		await this.repository.save(room);
		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
		return { newWord };
	}
	async changeWordScore(dto: ChangeWordScoreDto, user: UserDto) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (!room.currentRound) throw new RoundNotActiveError();
		if (room.currentRound.status !== RoundStatus.FINISHED)
			throw new RoundIsNotFinished();
		const isPlayerInGame = room.players.find((p) => p.id === user.id);
		if (!isPlayerInGame) throw new GameError("Player is not in the game");
		room.changeWordScore(dto.wordId, dto.delta);
		await this.repository.save(room);
		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
	}
	async getPrivatePlayerState(roomId: string, userId: string) {
		const room = await this.repository.findById(roomId);
		if (!room) return null;

		if (room.status === GameStatus.LOBBY || !room.currentRound) {
			return null;
		}

		if (room.currentRound.guesserId === userId) {
			return {
				word: room.currentRound.currentWord,
			};
		}

		return null;
	}
	public async deleteGame(dto: DeleteGameDto, user: UserDto) {
		const room = await this.repository.findById(dto.roomId);
		if (!room) throw new RoomNotFoundError(dto.roomId);
		if (room.ownerId !== user.id) throw new NotRoomOwnerError();
		if (room.status !== GameStatus.FINISHED) {
			throw new GameNotFinishedError();
		}
		await this.repository.delete(dto.roomId);
		const eventPayload: GameFinishedPayload = {
			room: room.toPrimitives(),
		};
		this.eventEmitter.emit(GAME_FINISHED, eventPayload);
	}
	private scheduleGameDeletion(roomId: string, milliseconds: number) {
		const timeoutName = `game_deletion_${roomId}`;
		const callback = () => {
			this.logger.log(
				`Deleting game ${roomId} after 24 hours of being finished`,
			);
			try {
				void this.repository.delete(roomId);
				this.logger.log(`Game ${roomId} deleted successfully`);
			} catch (error) {
				this.logger.error(`Failed to delete game ${roomId}: ${error}`);
			}
		};

		const timeout = setTimeout(callback, milliseconds);
		this.schedulerRegistry.addTimeout(timeoutName, timeout);
	}
	private scheduleRoundTimeout(roomId: string, milliseconds: number) {
		const timeoutName = `round_timeout_${roomId}`;
		try {
			this.schedulerRegistry.getTimeout(timeoutName);
			this.clearRoundTimeout(roomId);
		} catch (error) {
			console.error(error);
		}

		const callback = () => {
			this.logger.log(`Time is up for room ${roomId}`);
			void this.finishRound(roomId);
		};

		const timeout = setTimeout(callback, milliseconds);

		this.schedulerRegistry.addTimeout(timeoutName, timeout);
	}
	private clearRoundTimeout(roomId: string) {
		const timeoutName = `round_timeout_${roomId}`;
		this.schedulerRegistry.deleteTimeout(timeoutName);
	}
}
