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

import { TeamNotFoundError } from "../../../../common/errors/team.errors";
import { TeamEntity } from "./team.entity";
import { TeamError } from "../errors/team.errors";
import {
	GameInProgressError,
	GameNotInProgressError,
	PlayerNotFoundError,
	PlayersNotReadyError,
	TeamNameExistsError,
} from "../errors/game.errors";
import { PlayerEntity } from "./player.entity";
import { RoundEntity, RoundStatus } from "./round.entity";
import { v4 as uuidv4 } from "uuid";
import {
	RoundAlreadyActiveError,
	RoundIsNotFinished,
	RoundIsNotInProgress,
	RoundNotActiveError,
} from "../errors/round.errors";
/*
TeamEntity
Создать команду в игру
Удалить команду из игры
Добавить игрока в команду
Удалить игрока из команды
Изменить название команды
Добавить очки команде за раунд
Выбрать следующего игрока для загадывания слов в команде
*/
/*
RoundEntity
Если все игроки готовы к началу раунда
Начать раунд
Закончить раунд
Выбрать следующее слово для отгадывания/Передать слово загадывающему игроку
*/
/*
PlayerEntity
ID игрока зависит от JWT токена, который он использует для подключения к игре
Добавить игрока в игру/в команду
Удалить игрока из игры/из команды
Изменить Готовность игрока к началу игры
Изменить очки игрока
Дать игроку очки за раунд(если он загадывающий)
Изменить готовность к началу раунда
*/
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
}

export class GameEntity {
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
		this._players = players.map((p) => PlayerEntity.fromPrimitives(p));
		this._teams = teams.map((t) => TeamEntity.fromPrimitives(t));
		this._currentRound =
			currentRound && RoundEntity.fromPrimitives(currentRound);
		this.state = { ...initial };
	}

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
		return this._players;
	}
	get teams() {
		return this._teams;
	}
	get currentRound() {
		return this._currentRound;
	}
	get winnerTeamId() {
		return this.state.winnerTeamId;
	}

	updateSettings(newSettings: Partial<GameSettings>) {
		if (this.state.status !== GameStatus.LOBBY) {
			throw new GameInProgressError();
		}
		this.state.settings = { ...this.state.settings, ...newSettings };
	}
	addPlayer(id: string, name: string) {
		if (this._players.some((p) => p.id === id)) return;
		const player = PlayerEntity.create(id, name);
		this._players.push(player);
	}
	setPlayerOffline(playerId: string) {
		const player = this._players.find((p) => p.id === playerId);
		if (!player) throw new PlayerNotFoundError(playerId);
		player.isOnline = false;
	}
	setPlayerOnline(playerId: string) {
		const player = this._players.find((p) => p.id === playerId);
		if (!player) throw new PlayerNotFoundError(playerId);
		player.isOnline = true;
	}
	removePlayer(playerId: string) {
		this._players = this._players.filter((p) => p.id !== playerId);
		this.teams.forEach((t) => t.removePlayer(playerId));
	}
	togglePlayerReady(playerId: string) {
		const player = this._players.find((p) => p.id === playerId);
		if (!player) throw new PlayerNotFoundError(playerId);
		player.toggleReady();
	}
	togglePlayerRoundReady(playerId: string) {
		const player = this._players.find((p) => p.id === playerId);
		if (!player) throw new PlayerNotFoundError(playerId);
		player.toggleRoundReady();
	}
	createTeam(name: string) {
		if (this.state.status !== GameStatus.LOBBY) {
			throw new GameInProgressError();
		}
		if (this.teams.some((t) => t.name === name)) {
			throw new TeamNameExistsError(name);
		}
		const team = TeamEntity.create(name);
		this._teams.push(team);
		return team;
	}
	deleteTeam(teamId: string) {
		if (this.state.status !== GameStatus.LOBBY) {
			throw new GameInProgressError();
		}
		this._teams = this._teams.filter((t) => t.id !== teamId);
	}

	movePlayerToTeam(playerId: string, teamId: string) {
		const player = this._players.find((p) => p.id === playerId);
		if (!player) throw new PlayerNotFoundError(playerId);

		const targetTeam = this.teams.find((t) => t.id === teamId);
		if (!targetTeam) throw new TeamNotFoundError(teamId);
		if (targetTeam.playerIds.has(playerId)) return;

		this.teams.forEach((t) => t.removePlayer(playerId));
		targetTeam.addPlayer(playerId);
	}
	startGame() {
		if (this.teams.length < 2) {
			throw new TeamError("Need at least 2 teams to start");
		}
		const allReady =
			this._players.every((p) => p.isReady) && this._players.length > 0;
		if (!allReady) {
			throw new PlayersNotReadyError();
		}
		this.state.status = GameStatus.IN_PROGRESS;
	}
	createRound() {
		if (this.state.status !== GameStatus.IN_PROGRESS)
			throw new GameNotInProgressError();
		if (this._currentRound) throw new RoundAlreadyActiveError();

		const nextTeamIndex =
			(this.state.lastTeamPlayedIndex + 1) % this.teams.length;
		this.state.lastTeamPlayedIndex = nextTeamIndex;
		const team = this.teams[nextTeamIndex];
		const guesserId = team.getNextGuesserId();
		const round = RoundEntity.create(guesserId, team.id, 0);
		this._currentRound = round;
		return round;
	}
	changeWordScore(wordId: string, delta: number) {
		if (!this._currentRound) throw new RoundNotActiveError();
		if (this._currentRound.status !== RoundStatus.FINISHED)
			throw new RoundIsNotFinished();
		this._currentRound.changeWordScore(wordId, delta);
	}

	startRound(startTime: number) {
		if (this.state.status !== GameStatus.IN_PROGRESS)
			throw new GameNotInProgressError();
		if (!this._currentRound) throw new RoundNotActiveError();
		const currentTeamId = this._currentRound.teamId;
		const team = this.teams.find((t) => t.id === currentTeamId);
		if (!team) throw new TeamNotFoundError(currentTeamId);
		team.playerIds.forEach((id) => {
			const player = this.players.find((p) => p.id === id);
			if (!player || !player.isReady || !player.isRoundReady) {
				throw new PlayersNotReadyError();
			}
		});
		this._currentRound.startRound();

		this._currentRound.endTime =
			startTime + this.state.settings.roundTimeSeconds * 1000;
		this._players.forEach((p) => p.setRoundReady(false));
	}
	nextWord(text: string, wasSkipped: boolean = false) {
		if (!this._currentRound) throw new RoundNotActiveError();
		if (this._currentRound.status !== RoundStatus.IN_PROGRESS)
			throw new RoundIsNotInProgress();
		return this._currentRound.nextWord(text, wasSkipped);
	}
	finishRound() {
		if (!this._currentRound) throw new RoundNotActiveError();
		this._currentRound.finishRound();
	}
	calculateRoundPoints() {
		if (!this._currentRound) throw new RoundNotActiveError();
		if (this._currentRound.status !== RoundStatus.FINISHED)
			throw new RoundIsNotFinished();
		const round = this._currentRound;
		const words = this._currentRound.words;
		const team = this.teams.find((t) => t.id === round.teamId);
		if (!team) throw new TeamNotFoundError(round.teamId);
		const score = words.reduce((acc, current) => acc + current.score, 0);
		console.log(score);
		team.addScore(score);
		const player = this.players.find((p) => p.id === round.guesserId);
		if (!player) throw new PlayerNotFoundError(round.guesserId);

		player.addScore(score);
		this.checkWinCondition();
		this._currentRound = null;
	}
	private checkWinCondition() {
		const winner = this.teams.find(
			(t) => t.score >= this.state.settings.pointsToWin,
		);
		if (winner) {
			this.state.status = GameStatus.FINISHED;
			this.state.winnerTeamId = winner.id;
		}
	}
	toPrimitives(): GameState {
		return {
			...this.state,
			teams: this.teams.map((t) => t.toPrimitives()),
			currentRound: this._currentRound
				? this._currentRound.toPrimitives()
				: null,
			players: this.players.map((p) => p.toPrimitives()),
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
			},
			[],
			[],
			null,
		);
	}
}
