import type { WordPackSelection } from "../../application/word-pack-client.interface";

export type { WordPackSelection };

export enum GameStatus {
	LOBBY = "LOBBY",
	IN_PROGRESS = "IN_PROGRESS",
	FINISHED = "FINISHED",
}

export enum RoundStatus {
	PENDING = "PENDING",
	IN_PROGRESS = "IN_PROGRESS",
	POINTING = "POINTING",
	FINISHED = "FINISHED",
}

export type WordOutcome = "guessed" | "skipped" | "neutral";

export type EffectItemId =
	| "DOUBLE_POINTS"
	| "ENEMY_SKIP_PENALTY"
	| "FREE_SKIP_SHIELD"
	| "FREEZE_NEXT_WORD"
	| "VOICE_MUTE";

export type EffectDurationType = "round" | "charges" | "seconds" | "instant";

export type EffectStatus = "ARMED" | "ACTIVE" | "CONSUMED";

export interface ActiveEffect {
	id: string;
	itemId: EffectItemId;
	sourcePlayerId: string;
	targetTeamId?: string;
	targetPlayerId?: string;
	status: EffectStatus;
	expiresAt?: number;
	charges?: number;
}

/**
 * Word item representation for round.
 */
export interface WordItem {
	id: string;
	text: string;
	score: number;
	outcome?: WordOutcome;
	/** IDs of effects that were ACTIVE on the playing team at the moment this word was resolved */
	appliedEffectIds?: string[];
}

export type WordState = WordItem;

export const OWNER_OFFLINE_TIMEOUT_MS = 60_000;

/**
 * Player snapshot preserved when leaving an in-progress game.
 */
export interface LeftPlayerState {
	id: string;
	name: string;
	teamId: string | null;
	score: number;
	leftAt: number;
}

/**
 * Round state representation.
 */
export interface RoundState {
	id: string;
	/** Player who explains words to their team in this round */
	explainerId: string;
	teamId: string;
	status: RoundStatus | `${RoundStatus}`;
	currentWord: WordItem | null;
	words: WordItem[];
	roundNumber: number;
	endTime: number;
	pausedAt?: number | null;
	remainingMs?: number | null;
}

/**
 * Team state snapshot in the game.
 */
export interface TeamState {
	id: string;
	name: string;
	color?: string;
	score: number;
	playerIds?: string[];
	lastExplainerId?: string | null;
}

/**
 * Player state snapshot in the game.
 */
export interface PlayerState {
	id: string;
	name: string;
	teamId?: string;
	isReady: boolean;
	isRoundReady?: boolean;
	score?: number;
	isOnline?: boolean;
	role?: "anonymous" | "registered";
	submittedWordsCount?: number;
}

export interface GameSettings {
	name: string;
	roundTimeSeconds: number;
	pointsToWin: number;
	code: string | null;
	isPrivate: boolean;
	wordPackSelections: WordPackSelection[];
	wordsPerPlayer: number;
	isHatMode: boolean;
	isOnlyOwnerCanNextRound: boolean;
	isOnlyOwnerCanChangeScore: boolean;
	isVoiceChatEnabled: boolean;
	isShopEnabled?: boolean;
}

export interface GameSettingsState {
	name?: string;
	roundTimeSeconds?: number;
	pointsToWin?: number;
	code?: string | null;
	isPrivate?: boolean;
	wordsPerRound?: number;
	wordsPerPlayer?: number;
	customWordsAllowed?: boolean;
	dictionaryName?: string;
	isHatMode?: boolean;
	isOnlyOwnerCanNextRound?: boolean;
	isOnlyOwnerCanChangeScore?: boolean;
	isVoiceChatEnabled?: boolean;
	isShopEnabled?: boolean;
	wordPackSelections?: WordPackSelection[];
}

/**
 * Core game state.
 * Persistent data only. No transient calculation variables stored here.
 */
export interface GameState {
	id: string;
	ownerId: string;
	status: GameStatus | `${GameStatus}`;
	pointsToWin: number;
	roundTimeSeconds?: number;
	settings?: GameSettingsState;
	teams: TeamState[];
	players: PlayerState[];
	bannedPlayerIds: string[];
	spectators?: string[];
	leftPlayers?: LeftPlayerState[];
	ownerOfflineSince?: number | null;
	activeTeamId: string | null;
	winnerTeamId?: string | null;
	lastTeamPlayedIndex?: number;
	createdAt?: number;
	nextRoundNumber?: number;
	currentRound: RoundState | null;
	activeEffects?: ActiveEffect[];
	addons: Record<string, unknown>;
}
