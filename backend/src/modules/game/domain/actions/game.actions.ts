import type {
	EffectItemId,
	GameSettingsState,
	WordOutcome,
} from "../state/game.state";

export interface AddTeamAction {
	type: "ADD_TEAM";
	actorId?: string;
	payload: { teamId?: string; name: string; color?: string };
}

export interface DeleteTeamAction {
	type: "DELETE_TEAM";
	actorId: string;
	payload: { teamId: string };
}

export interface MoveToTeamAction {
	type: "MOVE_TO_TEAM";
	actorId?: string;
	payload: { playerId: string; teamId: string };
}

export interface MoveToSpectatorsAction {
	type: "MOVE_TO_SPECTATORS";
	actorId?: string;
	payload: { playerId: string };
}

export interface ShufflePlayersAction {
	type: "SHUFFLE_PLAYERS";
	actorId: string;
}

export interface JoinGameAction {
	type: "JOIN_GAME";
	actorId?: string;
	payload: {
		playerId: string;
		name: string;
		role?: "registered" | "anonymous";
	};
}

export interface LeaveGameAction {
	type: "LEAVE_GAME";
	actorId?: string;
	payload?: { playerId?: string };
}

export interface SetPlayerOfflineAction {
	type: "SET_PLAYER_OFFLINE";
	actorId?: string;
	payload?: { playerId?: string };
}

export interface TransferOwnershipAction {
	type: "TRANSFER_OWNERSHIP";
	actorId?: string;
	payload?: {
		newOwnerId?: string;
		targetPlayerId?: string;
		timeoutMs?: number;
	};
}

export interface UpdateSettingsAction {
	type: "UPDATE_SETTINGS";
	actorId: string;
	payload: Partial<GameSettingsState>;
}

export interface SubmitCustomWordsAction {
	type: "SUBMIT_CUSTOM_WORDS";
	actorId: string;
	payload: { wordsCount: number };
}

export interface ToggleReadyAction {
	type: "TOGGLE_READY";
	actorId?: string;
	payload: { playerId: string };
}

export interface ToggleRoundReadyAction {
	type: "TOGGLE_ROUND_READY";
	actorId?: string;
	payload?: { playerId?: string };
}

export interface KickPlayerAction {
	type: "KICK_PLAYER";
	actorId: string;
	payload: { targetPlayerId: string; isPermanent?: boolean };
}

export interface WordGuessedAction {
	type: "WORD_GUESSED";
	actorId: string;
	payload: { nextWordText: string };
}

export interface WordSkippedAction {
	type: "WORD_SKIPPED";
	actorId: string;
	payload: { nextWordText: string };
}

export interface BuyItemAction {
	type: "BUY_ITEM";
	actorId: string;
	payload: {
		itemId: EffectItemId;
		clientRequestId?: string;
	};
}

export interface UseItemAction {
	type: "USE_ITEM";
	actorId: string;
	payload: {
		inventoryItemId: string;
		targetTeamId?: string;
		targetPlayerId?: string;
		clientRequestId?: string;
	};
}

export interface ExpireEffectAction {
	type: "EXPIRE_EFFECT";
	actorId?: string;
	payload: {
		effectId: string;
	};
}

export interface StartRoundAction {
	type: "START_ROUND";
	actorId: string;
	payload: {
		durationSeconds: number;
		firstWordText?: string;
		force?: boolean;
	};
}

export interface StartPointingAction {
	type: "START_POINTING";
	actorId?: string;
}

export interface ChangeWordOutcomeAction {
	type: "CHANGE_WORD_OUTCOME";
	actorId?: string;
	payload: {
		wordId: string;
		outcome: WordOutcome;
	};
}

export interface EndPointingAction {
	type: "END_POINTING";
	actorId?: string;
}

export interface NextRoundAction {
	type: "NEXT_ROUND";
	actorId?: string;
	payload?: {
		nextTeamId?: string;
		nextExplainerId?: string;
	};
}

export interface SetExplainerAction {
	type: "SET_EXPLAINER";
	actorId: string;
	payload: { explainerId?: string; playerId?: string };
}

export interface ChangeRoundTimeAction {
	type: "CHANGE_ROUND_TIME";
	actorId?: string;
	payload: { expiresAt: number };
}

export interface StartGameAction {
	type: "START_GAME";
	actorId: string;
}

export interface EndGameAction {
	type: "END_GAME";
	actorId: string;
}

export interface DeleteGameAction {
	type: "DELETE_GAME";
	actorId: string;
	payload?: { requireFinished?: boolean };
}

export interface PauseGameAction {
	type: "PAUSE_GAME";
	actorId?: string;
	payload?: { reason?: string };
}

export interface ResumeGameAction {
	type: "RESUME_GAME";
	actorId?: string;
}

export interface FallbackGameAction {
	type: string;
	actorId?: string;
	payload?: unknown;
}

/**
 * Standard game actions dispatched to the domain pipeline.
 */
export type GameAction =
	| AddTeamAction
	| DeleteTeamAction
	| MoveToTeamAction
	| MoveToSpectatorsAction
	| ShufflePlayersAction
	| JoinGameAction
	| LeaveGameAction
	| SetPlayerOfflineAction
	| TransferOwnershipAction
	| UpdateSettingsAction
	| SubmitCustomWordsAction
	| ToggleReadyAction
	| ToggleRoundReadyAction
	| KickPlayerAction
	| WordGuessedAction
	| WordSkippedAction
	| BuyItemAction
	| UseItemAction
	| ExpireEffectAction
	| StartRoundAction
	| StartPointingAction
	| ChangeWordOutcomeAction
	| EndPointingAction
	| NextRoundAction
	| SetExplainerAction
	| ChangeRoundTimeAction
	| StartGameAction
	| EndGameAction
	| DeleteGameAction
	| PauseGameAction
	| ResumeGameAction
	| FallbackGameAction;
