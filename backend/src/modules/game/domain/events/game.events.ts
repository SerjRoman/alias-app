import { DomainEvent } from "@common/domain/domain-event";
import { GameState } from "../entities/game.entity";

export class GameStartedEvent extends DomainEvent {
	static readonly eventName = "GameStartedEvent";
	constructor(
		public readonly roomId: string,
		public readonly gameState: GameState,
	) {
		super(GameStartedEvent.eventName);
	}
}

export class GameFinishedEvent extends DomainEvent {
	static readonly eventName = "GameFinishedEvent";
	constructor(
		public readonly roomId: string,
		public readonly gameState: GameState,
	) {
		super(GameFinishedEvent.eventName);
	}
}
