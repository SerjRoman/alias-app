import type { DomainEvent } from "./domain-event";

export abstract class BaseEntity {
	private domainEvents: DomainEvent[] = [];

	protected addDomainEvent(event: DomainEvent) {
		this.domainEvents.push(event);
	}

	public pullDomainEvents(): DomainEvent[] {
		const events = this.domainEvents;
		this.domainEvents = [];
		return events;
	}
}
