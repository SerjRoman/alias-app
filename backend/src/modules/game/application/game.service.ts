import { Inject, Injectable, Logger } from "@nestjs/common";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "./game.repository.interface";
import {
	GameError,
	InvalidGameCode,
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
} from "./game.events";
import {
	ChangeWordScoreDto,
	CreateGameDto,
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
} from "../dto/body";
import { UserDto } from "../../auth/dto/user.dto";
import { SchedulerRegistry } from "@nestjs/schedule";
import { RoundNotActiveError } from "../domain/errors/round.errors";
import { RoundEntity } from "../domain/entities/round.entity";
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
	private async loadGame(gameId: string): Promise<GameEntity> {
		const game = await this.repository.findGameById(gameId);
		if (!game) throw new RoomNotFoundError(gameId);
		return game;
	}
	private async loadRound(game: GameEntity): Promise<RoundEntity> {
		if (!game.currentRound) {
			throw new RoundNotActiveError();
		}
		const round = await this.repository.findRoundById(game.currentRound.id);
		if (!round)
			throw new GameError(
				`Round with id ${game.currentRound.id} not found`,
			);
		return round;
	}
	private async getWordForGameSession(room: GameEntity) {
		let text: string | null = this.dictionaryService.getLastWordForGame(
			room.id,
		);
		if (!text) {
			await this.dictionaryService.setWordsForGame(
				room.id,
				100,
				room.settings.level,
			);
		}
		text = this.dictionaryService.getLastWordForGame(room.id);
		if (!text) {
			throw new GameError(
				"Unexpected error: no words available for the game",
			);
		}
		return text;
	}

	private async checkAndSetWordsForGame(room: GameEntity) {
		if (this.dictionaryService.getWordsForGame(room.id).length < 10) {
			await this.dictionaryService.setWordsForGame(
				room.id,
				100,
				room.settings.level,
			);
		}
	}

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
			isOnlyOwnerCanNextRound: true,
			isOnlyOwnerCanChangeScore: true,
		};
		const newRoom = GameEntity.create(user.id, settings);

		await this.repository.saveGame(newRoom);
		return { room: newRoom.toPrimitives(), code };
	}

	async findAll() {
		return (await this.repository.findAllGames()).map((g) =>
			g.toPrimitives(),
		);
	}

	async findOne(id: string) {
		return (await this.loadGame(id))?.toPrimitives();
	}

	async delete(id: string, user: UserDto) {
		const room = await this.loadGame(id);
		room.assertRoomOwner(user.id);
		return this.repository.deleteGame(id);
	}
	async validateCode(roomId: string, code?: string): Promise<boolean> {
		const room = await this.loadGame(roomId);
		if (!room.settings.code || !room.settings.isPrivate) return true;
		return room.settings.code === code;
	}
	async setPlayerOffline(roomId: string, playerId: string) {
		const room = await this.loadGame(roomId);
		room.setPlayerOffline(playerId);
		const players = await this.repository.findPlayersByGameId(
			roomId,
			room.players.map((p) => p.id),
		);
		await this.repository.saveGame(room);
		const eventPayload: PlayersUpdatedPayload = {
			players: players.map((p) => p.toPrimitives()),
			roomId: room.id,
		};
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayload);
	}

	async joinGame(dto: JoinGameDto, actor: UserDto) {
		const room = await this.loadGame(dto.roomId);
		if (room.settings.isPrivate && room.settings.code) {
			if (!(await this.validateCode(dto.roomId, dto.code)))
				throw new InvalidGameCode();
		}
		const existingPlayer = room.players.find((p) => p.id === actor.id);

		if (existingPlayer) {
			room.setPlayerOnline(existingPlayer.id);
		} else {
			room.joinRoom(actor.id, actor.name);
		}

		await this.repository.saveGame(room);
		await this.repository.setUserRoom(actor.id, room.id);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: GameUpdatedPayload = {
			room: roomPrimitives,
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);
		return roomPrimitives;
	}
	async toggleReady(roomId: string, user: UserDto) {
		const room = await this.loadGame(roomId);
		room.togglePlayerGameReady(user.id);
		await this.repository.saveGame(room);
		const eventPayload: PlayersUpdatedPayload = {
			roomId: room.id,
			players: room.players.map((p) => p.toPrimitives()),
		};
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayload);
		return room.toPrimitives();
	}
	async toggleRoundReady(roomId: string, user: UserDto) {
		const room = await this.loadGame(roomId);
		room.togglePlayerRoundReady(user.id);
		await this.repository.saveGame(room);
		const eventPayload: PlayersUpdatedPayload = {
			roomId: room.id,
			players: room.players.map((p) => p.toPrimitives()),
		};
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayload);
		return room.toPrimitives();
	}
	async playerLeftRoom(dto: PlayerLeftRoomDto) {
		const room = await this.loadGame(dto.roomId);
		room.leaveGame(dto.playerId);
		await this.repository.saveGame(room);
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
	async kickPlayer(dto: KickPlayerDto, actor: UserDto) {
		const room = await this.loadGame(dto.roomId);
		room.kickPlayer(actor.id, dto.playerId);
		await this.repository.saveGame(room);
		await this.repository.removeUserRoom(dto.playerId);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: PlayerKickedPayload = {
			kickedUserId: dto.playerId,
			roomId: room.id,
		};
		const eventPayloadTeams: TeamsUpdatedPayload = {
			roomId: room.id,
			teams: roomPrimitives.teams,
		};
		const eventPayloadPlayers: PlayersUpdatedPayload = {
			roomId: room.id,
			players: roomPrimitives.players,
		};
		this.eventEmitter.emit(PLAYER_KICKED, eventPayload);

		this.eventEmitter.emit(TEAMS_UPDATED, eventPayloadTeams);
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayloadPlayers);
		return roomPrimitives;
	}
	async updateGameSettings(dto: UpdateGameSettingsDto, actor: UserDto) {
		const room = await this.loadGame(dto.roomId);
		room.updateSettings(actor.id, dto);
		await this.repository.saveGame(room);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: GameUpdatedPayload = {
			room: roomPrimitives,
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);
		return roomPrimitives;
	}
	async startGame(roomId: string, actor: UserDto) {
		const room = await this.loadGame(roomId);
		await this.dictionaryService.setWordsForGame(
			roomId,
			100,
			room.settings.level,
		);
		room.startGame(actor.id);
		room.createRound();
		await this.repository.saveGame(room);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: GameStartedPayload = {
			room: roomPrimitives,
		};
		this.eventEmitter.emit(GAME_STARTED, eventPayload);
		return roomPrimitives;
	}
	async moveToTeam(dto: MoveToTeamDto, actor: UserDto) {
		const room = await this.loadGame(dto.roomId);
		if (dto.playerId) {
			room.movePlayerToTeam(dto.playerId, dto.teamId, actor.id);
		} else {
			room.movePlayerToTeam(actor.id, dto.teamId);
		}

		await this.repository.saveGame(room);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: TeamsUpdatedPayload = {
			roomId: room.id,
			teams: roomPrimitives.teams,
		};
		this.eventEmitter.emit(TEAMS_UPDATED, eventPayload);
		return roomPrimitives;
	}
	async deleteTeam(dto: DeleteTeamDto, actor: UserDto) {
		const room = await this.loadGame(dto.roomId);
		room.deleteTeam(actor.id, dto.teamId);
		await this.repository.saveGame(room);
		const roomPrimitives = room.toPrimitives();
		const eventPayload: TeamsUpdatedPayload = {
			roomId: room.id,
			teams: roomPrimitives.teams,
		};
		this.eventEmitter.emit(TEAMS_UPDATED, eventPayload);
		return roomPrimitives;
	}
	async createTeam(dto: CreateTeamDto, actor: UserDto) {
		const room = await this.loadGame(dto.roomId);
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
	async getRoomCode(dto: GetRoomCodeDto, actor: UserDto) {
		const room = await this.loadGame(dto.roomId);
		room.assertRoomOwner(actor.id);
		return { code: room.settings.code };
	}
	async getGameIdByUserId(userId: string) {
		const roomId = await this.repository.getUserRoom(userId);
		if (roomId) {
			const room = await this.loadGame(roomId);
			if (!room) {
				await this.repository.removeUserRoom(userId);
				return { roomId: null };
			}
		}
		return { roomId };
	}
	async startRound(dto: StartRoundDto, actor: UserDto) {
		const room = await this.loadGame(dto.roomId);
		if (!room.currentRound) {
			throw new RoundNotActiveError();
		}
		const startTime = Date.now();
		room.startRound(actor.id, startTime);
		this.scheduleRoundTimeout(
			room.id,
			room.settings.roundTimeSeconds * 1000,
		);
		const text = await this.getWordForGameSession(room);

		await this.checkAndSetWordsForGame(room);
		const word = room.nextWord(actor.id, text, false);

		await this.repository.saveGame(room);

		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
		return { word };
	}

	async finishRound(roomId: string) {
		const room = await this.loadGame(roomId);
		if (!room.currentRound) throw new RoundNotActiveError();
		await this.checkAndSetWordsForGame(room);

		room.finishRound();
		this.clearRoundTimeout(roomId);

		await this.repository.saveGame(room);

		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
	}
	async nextRound(dto: NextRoundDto, user: UserDto) {
		const room = await this.loadGame(dto.roomId);
		room.nextRound(user.id);
		if (room.status === GameStatus.FINISHED) {
			this.scheduleGameDeletion(room.id, 24 * 60 * 60 * 1000);
		} else {
			this.dictionaryService.popWordForGame(room.id);
		}
		await this.repository.saveGame(room);
		const eventPayload: GameUpdatedPayload = {
			room: room.toPrimitives(),
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);
	}
	async nextWord(dto: NextWordDto, actor: UserDto) {
		const room = await this.loadGame(dto.roomId);
		if (!room.currentRound) {
			throw new RoundNotActiveError();
		}
		room.assertRoundInProgress();
		room.assertIsGuesser(actor.id);
		if (room.currentRound.currentWord !== null) {
			this.dictionaryService.popWordForGame(room.id);
		}
		const text = await this.getWordForGameSession(room);
		const newWord = room.nextWord(actor.id, text, dto.wasSkipped);
		await this.checkAndSetWordsForGame(room);
		await this.repository.saveGame(room);
		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
		return { newWord };
	}
	async changeWordScore(dto: ChangeWordScoreDto, actor: UserDto) {
		const room = await this.loadGame(dto.roomId);
		if (!room.currentRound) throw new RoundNotActiveError();
		room.assertRoundIsFinished();
		room.changeWordScore(dto.wordId, dto.delta, actor.id);
		await this.repository.saveGame(room);
		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
	}
	async getPrivatePlayerState(roomId: string, userId: string) {
		const room = await this.loadGame(roomId);
		if (room.status !== GameStatus.IN_PROGRESS) {
			return null;
		}
		if (!room.currentRound) {
			return null;
		}

		if (room.currentRound.guesserId === userId) {
			return {
				word: room.currentRound.currentWord,
			};
		}

		return null;
	}
	public async deleteGame(dto: DeleteGameDto, actor: UserDto) {
		const room = await this.loadGame(dto.roomId);
		room.assertRoomOwner(actor.id);
		room.assertGameFinished();
		await this.repository.deleteGame(dto.roomId);
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
				void this.repository.deleteGame(roomId);
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
