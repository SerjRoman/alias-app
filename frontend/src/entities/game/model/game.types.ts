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
    lastExplainerId?: string | null;
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
    explainerId: string;
    teamId: string;
    endTime: number;
    status: RoundStatus;
    currentWord: WordState | null;
    words: WordState[];
    pausedAt?: number | null;
    remainingMs?: number | null;
    roundNumber?: number;
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
    isShopEnabled?: boolean;
    isOnlyOwnerCanNextRound?: boolean;
    isOnlyOwnerCanChangeScore?: boolean;
}

export interface LeftPlayerState {
    id: string;
    name: string;
    teamId: string | null;
    score: number;
    leftAt: number;
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
    activeTeamId?: string | null;
    lastTeamIndex?: number;
    lastTeamPlayedIndex?: number;
    spectators?: string[];
    leftPlayers?: LeftPlayerState[];
    ownerOfflineSince?: number | null;
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
    explainerParticipantId: string;
}
export interface TeamSummary {
    id: string;
    name: string;
}
export interface WordResponse {
    id: string;
    word: string;
    isGuessed: boolean;
    outcome?: "guessed" | "skipped" | "neutral";
    appliedEffectIds?: string[];
}

export interface RoundDetailsResponse {
    roundId: string;
    number: number;
    explainerId: string;
    teamId?: string;
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
