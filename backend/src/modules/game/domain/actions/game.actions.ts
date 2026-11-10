import type { GameSettingsState, WordOutcome } from "../state/game.state";

/**
 * Standard game actions dispatched to the domain pipeline.
 */
export type GameAction =
	| {
			type: "ADD_TEAM";
			actorId?: string;
			payload: { teamId?: string; name: string; color?: string };
	  }
	| {
			type: "DELETE_TEAM";
			actorId: string;
			payload: { teamId: string };
	  }
	| {
			type: "MOVE_TO_TEAM";
			actorId?: string;
			payload: { playerId: string; teamId: string };
	  }
	| {
			type: "MOVE_TO_SPECTATORS";
			actorId?: string;
			payload: { playerId: string };
	  }
	| {
			type: "SHUFFLE_PLAYERS";
			actorId: string;
	  }
	| {
			type: "JOIN_GAME";
			actorId?: string;
			payload: {
				playerId: string;
				name: string;
				role?: "registered" | "anonymous";
			};
	  }
	| {
			type: "LEAVE_GAME";
			actorId?: string;
			payload?: { playerId?: string };
	  }
	| {
			type: "SET_PLAYER_OFFLINE";
			actorId?: string;
			payload?: { playerId?: string };
	  }
	| {
			type: "TRANSFER_OWNERSHIP";
			actorId?: string;
			payload?: {
				newOwnerId?: string;
				targetPlayerId?: string;
				timeoutMs?: number;
			};
	  }
	| {
			type: "UPDATE_SETTINGS";
			actorId: string;
			payload: Partial<GameSettingsState>;
	  }
	| {
			type: "SUBMIT_CUSTOM_WORDS";
			actorId: string;
			payload: { wordsCount: number };
	  }
	| {
			type: "TOGGLE_READY";
			actorId?: string;
			payload: { playerId: string };
	  }
	| {
			type: "TOGGLE_ROUND_READY";
			actorId?: string;
			payload?: { playerId?: string };
	  }
	| {
			type: "KICK_PLAYER";
			actorId: string;
			payload: { targetPlayerId: string; isPermanent?: boolean };
	  }
	| {
			type: "WORD_GUESSED";
			actorId: string;
			payload: { nextWordText: string };
	  }
	| {
			type: "WORD_SKIPPED";
			actorId: string;
			payload: { nextWordText: string };
	  }
	| {
			type: "BUY_ITEM";
			actorId: string;
			payload: {
				teamId: string;
				item: string;
				targetPlayerId?: string;
			};
	  }
	| {
			type: "START_ROUND";
			actorId: string;
			payload: {
				durationSeconds: number;
				firstWordText?: string;
				force?: boolean;
			};
	  }
	| {
			type: "START_POINTING";
			actorId?: string;
	  }
	| {
			type: "CHANGE_WORD_SCORE";
			actorId?: string;
			payload: {
				wordId: string;
				delta: number;
				outcome?: WordOutcome;
			};
	  }
	| {
			type: "END_POINTING";
			actorId?: string;
	  }
	| {
			type: "NEXT_ROUND";
			actorId?: string;
			payload?: {
				nextTeamId?: string;
				nextExplainerId?: string;
			};
	  }
	| {
			type: "SET_EXPLAINER";
			actorId: string;
			payload: { explainerId?: string; playerId?: string };
	  }
	| {
			type: "CHANGE_ROUND_TIME";
			actorId?: string;
			payload: { endTime: number };
	  }
	| {
			type: "FINISH_ROUND";
			actorId: string;
	  }
	| {
			type: "START_GAME";
			actorId: string;
	  }
	| {
			type: "END_GAME";
			actorId: string;
	  }
	| {
			type: "DELETE_GAME";
			actorId: string;
			payload?: { requireFinished?: boolean };
	  }
	| {
			type: string;
			actorId?: string;
			payload?: unknown;
	  };
