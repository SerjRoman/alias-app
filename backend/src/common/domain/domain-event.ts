export abstract class DomainEvent {
	public readonly occurredAt: Date;
	public readonly name: string;

	constructor(name?: string) {
		this.occurredAt = new Date();
		this.name = name || this.constructor.name;
	}
}
