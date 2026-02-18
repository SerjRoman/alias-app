export class GameError extends Error {
	constructor(message: string) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class RoomNotFoundError extends GameError {
	constructor(roomId: string) {
		super(`Room with ID ${roomId} not found`);
	}
}

export class NotRoomOwnerError extends GameError {
	constructor() {
		super("User is not the owner of the room");
	}
}
export class NotInGameError extends GameError {
	constructor() {
		super("User is not in the game room");
	}
}

export class PlayerAlreadyInGameError extends GameError {
	constructor(playerId: string) {
		super(`Player with ID ${playerId} is already in the game room`);
	}
}

export class NegativePointsError extends GameError {
	constructor(points: number) {
		super(`Points cannot be negative: ${points}`);
	}
}
export class GameInProgressError extends GameError {
	constructor() {
		super("Cannot change settings while game is in progress");
	}
}
export class GameNotInProgressError extends GameError {
	constructor() {
		super("Cannot change settings while game is not in progress");
	}
}
export class TeamNameExistsError extends GameError {
	constructor(teamName: string) {
		super(`Team name already exists: ${teamName}`);
	}
}
export class PlayerNotFoundError extends GameError {
	constructor(playerId: string) {
		super(`Player with ID ${playerId} not found in game room`);
	}
}

export class RoundAlreadyActiveError extends GameError {
	constructor() {
		super("A round is already active");
	}
}

export class PlayersNotReadyError extends GameError {
	constructor() {
		super("Not all players are ready");
	}
}

export class RoundNotActiveError extends GameError {
	constructor() {
		super("No active round");
	}
}
