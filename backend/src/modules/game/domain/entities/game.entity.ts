/*
Game 
Начинается при готовности всех игроков в игре
Начать игру
Закончить игру
Удалить игрока игры
Добавить игрока в игру
Изменение текущего состояние игры
Время на раунд/Изменение времени на раунд
Название комнаты/изменение названия комнаты
Количество очков для победы
Если очков достаточно для победы, тогда игра заканчивается и есть победитель
*/

import { TeamEntity } from "./team.entity";
import { TeamError, TeamNotFoundError } from "../errors/team.errors";
import {
	GameError,
	GameNotFinishedError,
	GameNotInLobbyError,
	GameNotInProgressError,
	PlayerAlreadyInGameError,
	PlayerNotFoundError,
	PlayerNotRoomOwnerError,
	PlayersNotReadyError,
	TeamNameExistsError,
} from "../errors/game.errors";
import { PlayerEntity } from "./player.entity";
import { RoundEntity, RoundStatus } from "./round.entity";
import { v4 as uuidv4 } from "uuid";
import {
	RoundAlreadyStarted,
	RoundIsNotFinished,
	RoundIsNotInProgress,
	RoundIsNotPending,
	RoundIsNotPointing,
	RoundNotActiveError,
} from "../errors/round.errors";
import { BaseEntity } from "@common/domain/base-entity";
import {
	RoundFinishedEvent,
	RoundPointingEndedEvent,
	RoundStartedEvent,
} from "../events/round.events";
import { GameFinishedEvent, GameStartedEvent } from "../events/game.events";

export enum GameStatus {
	LOBBY = "LOBBY",
	IN_PROGRESS = "IN_PROGRESS",
	FINISHED = "FINISHED",
}
export type GameWordsLevel = "easy" | "medium" | "hard";

export interface GameSettings {
	name: string;
	roundTimeSeconds: number;
	pointsToWin: number;
	code: string | null;
	isPrivate: boolean;
	level: GameWordsLevel;
	isOnlyOwnerCanNextRound: boolean;
	isOnlyOwnerCanChangeScore: boolean;
}
type TeamState = ReturnType<TeamEntity["toPrimitives"]>;
type PlayerState = ReturnType<PlayerEntity["toPrimitives"]>;
type RoundState = ReturnType<RoundEntity["toPrimitives"]>;
export interface GameState {
	id: string;
	ownerId: string;
	status: GameStatus;
	settings: GameSettings;
	teams: TeamState[];
	currentRound: RoundState | null;
	players: PlayerState[];
	winnerTeamId: string | null;
	lastTeamPlayedIndex: number;
	createdAt: number;
	nextRoundNumber: number;
}

export class GameEntity extends BaseEntity {
	private readonly state: Omit<
		GameState,
		"teams" | "players" | "currentRound"
	>;
	private _teams: TeamEntity[] = [];
	private _players: PlayerEntity[] = [];
	private _currentRound: RoundEntity | null = null;
	private constructor(
		initial: Omit<GameState, "teams" | "players" | "currentRound">,
		teams: TeamState[],
		players: PlayerState[],
		currentRound: RoundState | null,
	) {
		super();

		this._players = players.map((p) => PlayerEntity.fromPrimitives(p));
		this._teams = teams.map((t) => TeamEntity.fromPrimitives(t));
		this._currentRound =
			currentRound && RoundEntity.fromPrimitives(currentRound);
		this.state = { ...initial };
	}

	// Getters
	get id() {
		return this.state.id;
	}
	get ownerId() {
		return this.state.ownerId;
	}
	get status() {
		return this.state.status;
	}
	get settings() {
		return { ...this.state.settings };
	}
	get players() {
		return [...this._players];
	}
	get teams() {
		return [...this._teams];
	}
	get currentRound() {
		return this._currentRound;
	}
	get winnerTeamId() {
		return this.state.winnerTeamId;
	}
	private getPlayerOrThrow(playerId: string) {
		const player = this._players.find((p) => p.id === playerId);
		if (!player) throw new PlayerNotFoundError(playerId);
		return player;
	}
	private getTeamOrThrow(teamId: string) {
		const team = this._teams.find((t) => t.id === teamId);
		if (!team) throw new TeamNotFoundError(teamId);
		return team;
	}
	private getRoundOrThrow() {
		if (!this._currentRound) throw new RoundNotActiveError();
		return this._currentRound;
	}
	// Guards
	assertRoomOwner(actorId: string) {
		if (this.state.ownerId !== actorId) {
			throw new PlayerNotRoomOwnerError();
		}
	}
	assertGameInLobby() {
		if (this.state.status !== GameStatus.LOBBY) {
			throw new GameNotInLobbyError();
		}
	}
	assertGameInProgress() {
		if (this.state.status !== GameStatus.IN_PROGRESS) {
			throw new GameNotInProgressError();
		}
	}
	assertCanStartGame(actorId: string) {
		this.assertGameInLobby();
		this.assertRoomOwner(actorId);

		if (this._teams.length < 2) {
			throw new TeamError("Need at least 2 teams to start");
		}
		const allReady =
			this._players.every((p) => p.isReady) && this._players.length > 0;
		if (!allReady) {
			throw new PlayersNotReadyError();
		}
	}
	assertIsRoundActive() {
		if (!this._currentRound) throw new RoundNotActiveError();
	}
	assertIsRoundNotActive() {
		if (this._currentRound) throw new RoundAlreadyStarted();
	}
	assertIsGuesser(playerId: string) {
		const round = this.getRoundOrThrow();
		if (round.guesserId !== playerId) {
			throw new PlayerNotFoundError(playerId);
		}
	}
	assertRoundInProgress() {
		const round = this.getRoundOrThrow();
		if (round.status !== RoundStatus.IN_PROGRESS) {
			throw new RoundIsNotInProgress();
		}
	}
	assertRoundIsPointing() {
		const round = this.getRoundOrThrow();
		if (round.status !== RoundStatus.POINTING) {
			throw new RoundIsNotPointing();
		}
	}
	assertRoundIsFinished() {
		const round = this.getRoundOrThrow();
		if (round.status !== RoundStatus.FINISHED) {
			throw new RoundIsNotFinished();
		}
	}
	assertRoundIsPending() {
		const round = this.getRoundOrThrow();
		if (round.status !== RoundStatus.PENDING) {
			throw new RoundIsNotPending();
		}
	}
	assertGameFinished() {
		if (this.state.status !== GameStatus.FINISHED) {
			throw new GameNotFinishedError();
		}
	}

	// Actions

	updateSettings(newSettings: Partial<GameSettings>, actorId: string) {
		this.assertRoomOwner(actorId);
		this.assertGameInLobby();
		this.state.settings = { ...this.state.settings, ...newSettings };
	}
	joinRoom(
		playerId: string,
		name: string,
		role: "registered" | "anonymous" = "anonymous",
	) {
		this.assertGameInLobby();
		if (this._players.some((p) => p.id === playerId)) {
			throw new PlayerAlreadyInGameError(playerId);
		}
		const player = PlayerEntity.create(playerId, name, role);
		this._players.push(player);
	}
	setPlayerOffline(playerId: string) {
		const player = this.getPlayerOrThrow(playerId);
		player.isOnline = false;
	}
	setPlayerOnline(playerId: string) {
		const player = this.getPlayerOrThrow(playerId);
		player.isOnline = true;
	}
	removePlayer(actorId: string, playerId: string) {
		this.assertRoomOwner(actorId);
		this.getPlayerOrThrow(playerId);
		this._players = this._players.filter((p) => p.id !== playerId);
		this._teams.forEach((t) => t.removePlayer(playerId));
	}
	leaveGame(playerId: string) {
		this.getPlayerOrThrow(playerId);
		this._players = this._players.filter((p) => p.id !== playerId);
		this._teams.forEach((t) => t.removePlayer(playerId));
	}
	togglePlayerGameReady(playerId: string, actorId?: string) {
		if (actorId) {
			this.assertRoomOwner(actorId);
		}
		const player = this.getPlayerOrThrow(playerId);
		player.toggleReady();
	}
	togglePlayerRoundReady(playerId: string, actorId?: string) {
		if (actorId) {
			this.assertRoomOwner(actorId);
		}
		const player = this.getPlayerOrThrow(playerId);
		player.toggleRoundReady();
	}
	createTeam(actorId: string, name: string) {
		this.assertRoomOwner(actorId);
		this.assertGameInLobby();
		if (this.teams.some((t) => t.name === name)) {
			throw new TeamNameExistsError(name);
		}
		const team = TeamEntity.create(name);
		this._teams.push(team);
		return team;
	}
	deleteTeam(actorId: string, teamId: string) {
		this.assertRoomOwner(actorId);
		this.assertGameInLobby();
		this.getTeamOrThrow(teamId);
		this._teams = this._teams.filter((t) => t.id !== teamId);
	}

	movePlayerToTeam(playerId: string, teamId: string, actorId?: string) {
		if (actorId) {
			this.assertRoomOwner(actorId);
		}
		this.assertGameInLobby();
		this.getPlayerOrThrow(playerId);
		const targetTeam = this.getTeamOrThrow(teamId);
		if (targetTeam.playerIds.has(playerId)) return;

		this._teams.forEach((t) => t.removePlayer(playerId));
		targetTeam.addPlayer(playerId);
	}
	kickPlayer(actorId: string, playerId: string) {
		this.assertRoomOwner(actorId);
		this.getPlayerOrThrow(playerId);
		if (this.state.ownerId === playerId) {
			throw new GameError("Owner cannot kick himself");
		}
		this.leaveGame(playerId);
	}
	startGame(actorId: string) {
		this.assertCanStartGame(actorId);
		this.state.status = GameStatus.IN_PROGRESS;
		this.addDomainEvent(new GameStartedEvent(this.id, this.toPrimitives()));
	}
	createRound() {
		this.assertGameInProgress();
		this.assertIsRoundNotActive();

		const nextTeamIndex =
			(this.state.lastTeamPlayedIndex + 1) % this._teams.length;
		this.state.lastTeamPlayedIndex = nextTeamIndex;
		const team = this._teams[nextTeamIndex];
		const guesserId = team.getNextGuesserId();
		const round = RoundEntity.create(
			guesserId,
			team.id,
			0,
			this.state.nextRoundNumber,
		);
		this._currentRound = round;
		this.state.nextRoundNumber += 1;
		return round;
	}
	changeWordScore(wordId: string, delta: number, actorId?: string) {
		if (this.settings.isOnlyOwnerCanChangeScore) {
			if (actorId) {
				this.assertRoomOwner(actorId);
			} else {
				throw new PlayerNotFoundError("No actor ID provided");
			}
		}
		this.assertGameInProgress();
		this.assertRoundIsPointing();
		const currentRound = this.getRoundOrThrow();
		currentRound.changeWordScore(wordId, delta);
	}

	startRound(actorId: string, startTime: number) {
		this.assertGameInProgress();
		this.assertRoundIsPending();
		const currentRound = this.getRoundOrThrow();
		this.assertIsGuesser(actorId);
		const currentTeamId = currentRound.teamId;
		const team = this.getTeamOrThrow(currentTeamId);
		team.playerIds.forEach((id) => {
			const player = this.getPlayerOrThrow(id);
			if (!player.isReady || !player.isRoundReady) {
				throw new PlayersNotReadyError();
			}
		});
		currentRound.startRound();
		currentRound.endTime =
			startTime + this.state.settings.roundTimeSeconds * 1000;
		this._players.forEach((p) => p.setRoundReady(false));
		this.addDomainEvent(new RoundStartedEvent(this.id, actorId));
	}
	nextWord(actorId: string, text: string, wasSkipped: boolean = false) {
		this.assertGameInProgress();
		this.assertIsGuesser(actorId);
		this.assertRoundInProgress();
		const currentRound = this.getRoundOrThrow();
		return currentRound.nextWord(text, wasSkipped);
	}
	finishRound() {
		this.assertGameInProgress();
		const currentRound = this.getRoundOrThrow();
		currentRound.finishRound();
		this.addDomainEvent(
			new RoundFinishedEvent(this.id, this.toPrimitives()),
		);
		this._currentRound = null;
	}
	startPointing() {
		this.assertGameInProgress();
		this.assertRoundInProgress();
		const currentRound = this.getRoundOrThrow();
		currentRound.pointRound();
	}
	setGuesser(guesserId: string, actorId: string) {
		this.assertGameInProgress();
		this.assertRoomOwner(actorId);
		const currentRound = this.getRoundOrThrow();
		const team = this.getTeamOrThrow(currentRound.teamId);
		if (!team.playerIds.has(guesserId)) {
			throw new PlayerNotFoundError(guesserId);
		}
		currentRound.guesserId = guesserId;
	}
	endGame(actorId: string) {
		this.assertRoomOwner(actorId);
		this._finishGame();
	}
	private _finishGame() {
		this.state.status = GameStatus.FINISHED;
		this.state.winnerTeamId = this.checkWinCondition()?.id || null;
		this._currentRound = null;
		this.addDomainEvent(
			new GameFinishedEvent(this.id, this.toPrimitives()),
		);
	}
	endPointing() {
		this.assertGameInProgress();
		this.assertRoundIsPointing();

		const currentRound = this.getRoundOrThrow();

		const words = currentRound.words;
		const score = words.reduce((acc, current) => acc + current.score, 0);

		const team = this.getTeamOrThrow(currentRound.teamId);
		const player = this.getPlayerOrThrow(currentRound.guesserId);

		team.addScore(score);
		player.addScore(score);
		currentRound.finishRound();

		this.addDomainEvent(
			new RoundPointingEndedEvent(this.id, this.toPrimitives()),
		);
		const winner = this.checkWinCondition();
		if (winner) {
			this._finishGame();
		}
	}
	nextRound(actorId?: string) {
		this.assertGameInProgress();
		this.assertIsRoundNotActive();
		if (this.settings.isOnlyOwnerCanNextRound) {
			if (actorId) {
				this.assertRoomOwner(actorId);
			} else {
				throw new PlayerNotFoundError("No actor ID provided");
			}
		}
		this.createRound();
	}

	private checkWinCondition() {
		const winner = this._teams.find(
			(t) => t.score >= this.state.settings.pointsToWin,
		);
		return winner;
	}
	toPrimitives(): GameState {
		return {
			...this.state,
			teams: this._teams.map((t) => t.toPrimitives()),
			currentRound: this._currentRound
				? this._currentRound.toPrimitives()
				: null,
			players: this._players.map((p) => p.toPrimitives()),
		};
	}
	static fromPrimitives(state: GameState): GameEntity {
		const { teams, players, currentRound, ...rest } = state;
		const game = new GameEntity(rest, teams, players, currentRound);
		return game;
	}
	static create(ownerId: string, settings: GameSettings): GameEntity {
		return new GameEntity(
			{
				id: uuidv4(),
				ownerId,
				status: GameStatus.LOBBY,
				settings,
				winnerTeamId: null,
				lastTeamPlayedIndex: -1,
				createdAt: Date.now(),
				nextRoundNumber: 1,
			},
			[],
			[],
			null,
		);
	}
}
