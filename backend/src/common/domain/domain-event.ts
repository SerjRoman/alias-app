import { v4 as uuidv4 } from "uuid";
export abstract class DomainEvent {
	public readonly occurredAt: Date;
	public readonly name: string;
	public readonly id: string;

	constructor(name?: string) {
		this.occurredAt = new Date();
		this.name = name || this.constructor.name;
		this.id = uuidv4();
	}
}
