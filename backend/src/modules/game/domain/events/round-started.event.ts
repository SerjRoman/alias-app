import { DomainEvent } from "@common/domain/domain-event";

export class RoundStartedEvent extends DomainEvent {
	constructor(
		public readonly roomId: string,
		public readonly startedBy: string,
	) {
		super();
	}
}
