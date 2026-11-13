import type { PausableTimer } from "../time/pausable-timer";
import type { GameAddons } from "../addons/addons.types";

export interface WordPackSelection {
	packId: string;
	count: number;
}

export const GameStatus = {
	LOBBY: "LOBBY",
	IN_PROGRESS: "IN_PROGRESS",
	FINISHED: "FINISHED",
} as const;
export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

export const RoundStatus = {
	PENDING: "PENDING",
	IN_PROGRESS: "IN_PROGRESS",
	POINTING: "POINTING",
	FINISHED: "FINISHED",
} as const;
export type RoundStatus = (typeof RoundStatus)[keyof typeof RoundStatus];

export type WordOutcome = "guessed" | "skipped" | "neutral";

export type EffectItemId =
	| "DOUBLE_POINTS"
	| "ENEMY_SKIP_PENALTY"
	| "FREE_SKIP_SHIELD"
	| "FREEZE_NEXT_WORD"
	| "VOICE_MUTE"
	| "CLEANSE"
	| "EXTRA_TIME"
	| "TIME_DRAIN"
	| "FLIP_WORD"
	| "REROLL_WORD";

export type EffectDurationType = "round" | "charges" | "seconds" | "instant";

export type EffectStatus = "ARMED" | "ACTIVE" | "CONSUMED";

export interface ActiveEffect extends PausableTimer {
	id: string;
	itemId: EffectItemId;
	sourcePlayerId: string;
	targetTeamId?: string;
	targetPlayerId?: string;
	status: EffectStatus;
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
export interface RoundState extends PausableTimer {
	id: string;
	/** Player who explains words to their team in this round */
	explainerId: string;
	teamId: string;
	status: RoundStatus;
	currentWord: WordItem | null;
	words: WordItem[];
	roundNumber: number;
	expiresAt: number;
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
	isShopEnabled: boolean;
	isBettingEnabled: boolean;
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
	isBettingEnabled?: boolean;
	wordPackSelections?: WordPackSelection[];
}

/**
 * Core game state.
 * Persistent data only. No transient calculation variables stored here.
 */
export interface GameState {
	id: string;
	ownerId: string;
	status: GameStatus;
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
	activeEffects: ActiveEffect[];
	addons: GameAddons;
}
