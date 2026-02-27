export enum GameStatus {
	LOBBY = "LOBBY",
	IN_PROGRESS = "IN_PROGRESS",
	FINISHED = "FINISHED",
}
export enum RoundStatus {
	PENDING = "PENDING",
	IN_PROGRESS = "IN_PROGRESS",
	FINISHED = "FINISHED",
}
export interface WordState {
	id: string;
	word: string;
	score: number;
}
export interface TeamState {
	id: string;
	name: string;
	playerIds: string[];
	score: number;
	lastGuesserIndex: number;
}
export interface PlayerState {
	id: string;
	name: string;
	isReady: boolean;
	isRoundReady: boolean;
	score: number;
	isOnline: boolean;
}

export interface RoundState {
	id: string;
	guesserId: string;
	teamId: string;
	endTime: number;
	status: RoundStatus;
	currentWord: WordState | null;
	words: WordState[];
}
export interface GameSettings {
	roundTimeSeconds: number;
	pointsToWin: number;
	name: string;
	isPrivate: boolean;
}
export interface GameState {
	id: string;
	ownerId: string;
	status: GameStatus;
	settings: GameSettings;
	playersCount: number;
}

export interface GameStateDetails extends GameState {
	teams: TeamState[];
	currentRound: RoundState | null;
	players: PlayerState[];
	winnerTeamId: string | null;
	lastTeamIndex: number;
}
