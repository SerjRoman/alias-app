export class TeamError extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class TeamIsEmptyError extends TeamError {
	constructor() {
		super("Team is empty");
	}
}
export class TeamNameEmptyError extends TeamError {
	constructor() {
		super("Team name is empty");
	}
}

export class PlayerAlreadyInTeamError extends TeamError {
	constructor() {
		super("Player is already in the team");
	}
}
