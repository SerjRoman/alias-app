export abstract class DomainEvent {
	public readonly occurredAt: Date;

	constructor() {
		this.occurredAt = new Date();
	}
}
