import { DomainEvent } from "@common/domain/domain-event";
import { GameState } from "../entities/game.entity";

export class RoundStartedEvent extends DomainEvent {
	static readonly eventName = "RoundStartedEvent";
	constructor(
		public readonly roomId: string,
		public readonly startedBy: string,
	) {
		super(RoundStartedEvent.eventName);
	}
}

export class RoundFinishedEvent extends DomainEvent {
	static readonly eventName = "RoundFinishedEvent";
	constructor(
		public readonly roomId: string,
		public readonly gameState: GameState,
	) {
		super(RoundFinishedEvent.eventName);
	}
}
export class RoundPointingEndedEvent extends DomainEvent {
	static readonly eventName = "RoundPointingEndedEvent";
	constructor(
		public readonly roomId: string,
		public readonly gameState: GameState,
	) {
		super(RoundPointingEndedEvent.eventName);
	}
}
