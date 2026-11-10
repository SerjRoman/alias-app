import { DomainEvent } from "@common/domain/domain-event";
import type {
	GameState,
	RoundState,
	TeamState,
	WordItem,
} from "../state/game.state";

export { DomainEvent };

/**
 * Domain event emitted when a team is created in lobby.
 */
export class TeamCreatedDomainEvent extends DomainEvent {
	static readonly eventName = "TeamCreatedEvent";

	constructor(
		public readonly roomId: string,
		public readonly team: TeamState,
	) {
		super(TeamCreatedDomainEvent.eventName);
	}
}

/**
 * Domain event emitted when a player toggles ready state.
 */
export class PlayerReadyToggledDomainEvent extends DomainEvent {
	static readonly eventName = "PlayerReadyToggledEvent";

	constructor(
		public readonly roomId: string,
		public readonly playerId: string,
		public readonly isReady: boolean,
	) {
		super(PlayerReadyToggledDomainEvent.eventName);
	}
}

/**
 * Domain event emitted when a player is kicked.
 */
export class PlayerKickedDomainEvent extends DomainEvent {
	static readonly eventName = "PlayerKickedEvent";

	constructor(
		public readonly roomId: string,
		public readonly targetPlayerId: string,
		public readonly isPermanent: boolean,
	) {
		super(PlayerKickedDomainEvent.eventName);
	}
}

/**
 * Domain event emitted when a word is successfully guessed.
 */
export class WordGuessedDomainEvent extends DomainEvent {
	static readonly eventName = "WordGuessedEvent";

	constructor(
		public readonly roomId: string,
		public readonly wordText: string,
		public readonly scoreDelta: number,
		public readonly totalTeamScore: number,
	) {
		super(WordGuessedDomainEvent.eventName);
	}
}

/**
 * Domain event emitted when a word is skipped.
 */
export class WordSkippedDomainEvent extends DomainEvent {
	static readonly eventName = "WordSkippedEvent";

	constructor(
		public readonly roomId: string,
		public readonly wordText: string,
		public readonly penalty: number,
	) {
		super(WordSkippedDomainEvent.eventName);
	}
}

/**
 * Domain event emitted when a word cycles to the next word.
 */
export class WordCycledDomainEvent extends DomainEvent {
	static readonly eventName = "WordCycledEvent";

	constructor(
		public readonly roomId: string,
		public readonly previousWord: WordItem,
		public readonly nextWord: WordItem | null,
	) {
		super(WordCycledDomainEvent.eventName);
	}
}

/**
 * Domain event emitted when a round starts.
 */
export class RoundStartedDomainEvent extends DomainEvent {
	static readonly eventName = "RoundStartedEvent";

	constructor(
		public readonly roomId: string,
		public readonly roundId: string,
		public readonly teamId: string,
		public readonly explainerId: string,
		public readonly endTime: number,
	) {
		super(RoundStartedDomainEvent.eventName);
	}
}

/**
 * Domain event emitted when a round finishes guessing and enters pointing mode.
 */
export class RoundPointingStartedDomainEvent extends DomainEvent {
	static readonly eventName = "RoundPointingStartedEvent";

	constructor(
		public readonly roomId: string,
		public readonly roundId: string,
		public readonly words: WordItem[],
	) {
		super(RoundPointingStartedDomainEvent.eventName);
	}
}

/**
 * Domain event emitted when a word score is edited during pointing.
 */
export class WordScoreChangedDomainEvent extends DomainEvent {
	static readonly eventName = "WordScoreChangedEvent";

	constructor(
		public readonly roomId: string,
		public readonly roundId: string,
		public readonly wordId: string,
		public readonly newScore: number,
		public readonly teamScore: number,
	) {
		super(WordScoreChangedDomainEvent.eventName);
	}
}

/**
 * Domain event emitted when pointing ends and the round is finalized.
 */
export class RoundEndedDomainEvent extends DomainEvent {
	static readonly eventName = "RoundFinishedEvent";

	constructor(
		public readonly roomId: string,
		public readonly roundId: string,
		public readonly teamId: string,
		public readonly totalTeamScore: number,
		public readonly isGameFinished: boolean,
		public gameState: GameState = {} as GameState,
	) {
		super(RoundEndedDomainEvent.eventName);
	}
}

/**
 * Domain event emitted when a new round is created.
 */
export class RoundCreatedDomainEvent extends DomainEvent {
	static readonly eventName = "RoundCreatedEvent";

	constructor(
		public readonly roomId: string,
		public readonly round: RoundState,
	) {
		super(RoundCreatedDomainEvent.eventName);
	}
}

/**
 * Domain event emitted when the game starts.
 */
export class GameStartedDomainEvent extends DomainEvent {
	static readonly eventName = "GameStartedEvent";

	constructor(
		public readonly roomId: string,
		public readonly initialRound: RoundState,
		public gameState: GameState = {} as GameState,
	) {
		super(GameStartedDomainEvent.eventName);
	}
}

/**
 * Domain event emitted when the game finishes.
 */
export class GameFinishedDomainEvent extends DomainEvent {
	static readonly eventName = "GameFinishedEvent";

	constructor(
		public readonly roomId: string,
		public readonly winnerTeamId: string | null,
		public readonly teams: TeamState[],
		public gameState: GameState = {} as GameState,
	) {
		super(GameFinishedDomainEvent.eventName);
	}
}

/**
 * Domain event emitted when the game room is deleted.
 */
export class GameDeletedDomainEvent extends DomainEvent {
	static readonly eventName = "GameDeletedEvent";

	constructor(
		public readonly roomId: string,
		public readonly playerIds: string[],
	) {
		super(GameDeletedDomainEvent.eventName);
	}
}

export {
	GameStartedDomainEvent as GameStartedEvent,
	GameFinishedDomainEvent as GameFinishedEvent,
	GameDeletedDomainEvent as GameDeletedEvent,
	RoundEndedDomainEvent as RoundFinishedEvent,
};
