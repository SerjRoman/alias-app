import type { PaginatedResponse } from "@shared/lib";

export enum GameStatus {
	LOBBY = "LOBBY",
	IN_PROGRESS = "IN_PROGRESS",
	FINISHED = "FINISHED",
	// CANCELLED = "CANCELLED",
}
export enum RoundStatus {
	PENDING = "PENDING",
	IN_PROGRESS = "IN_PROGRESS",
	POINTING = "POINTING",
	FINISHED = "FINISHED",
}
export type GameWordsLevel = "easy" | "medium" | "hard";

export interface WordState {
	id: string;
	text: string;
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
	role: "registered" | "anonymous";
	submittedWordsCount?: number;
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
	name: string;
	roundTimeSeconds: number;
	pointsToWin: number;
	isPrivate: boolean;
	wordsPerPlayer?: number;
	isHatMode?: boolean;
	wordPackSelections?: { packId: string; count: number }[];
	isVoiceChatEnabled?: boolean;
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

export interface GameStateUpdatePayload extends Omit<GameStateDetails, "settings"> {
	settings?: GameSettings;
}

export interface ParticipantDisplayData {
	isRegistered: boolean;
	userId: string | null;
	name: string;
	avatarUrl: string;
}

export interface GameSummaryParticipant {
	participantId: string;
	teamId: string;
	score: number;
	displayData: ParticipantDisplayData;
}

export interface ParticipantStats {
	participantId: string;
	teamId: string;
	scoreAfterRound: number;
}

// Раунды
export interface RoundSummary {
	id: string;
	roundNumber: number;
	teamId: string;
	guesserParticipantId: string;
}
export interface TeamSummary {
	id: string;
	name: string;
}
export interface WordResponse {
	id: string;
	word: string;
	isGuessed: boolean;
}

export interface RoundDetailsResponse {
	roundId: string;
	number: number;
	words: WordResponse[];
	participantsStats: ParticipantStats[];
}

export type PaginatedRoundDetailsResponse =
	PaginatedResponse<RoundDetailsResponse>;

export interface GameSummaryResponse {
	id: string;
	status: GameStatus | string;
	createdAt: string;
	settings: GameSettings;
	participants: GameSummaryParticipant[];
	roundsSummary: RoundSummary[];
	teams: TeamSummary[];
}

export type PaginatedGameSummaryResponse =
	PaginatedResponse<GameSummaryResponse>;

export interface GameResponse extends GameState {
	createdAt: string;
}
