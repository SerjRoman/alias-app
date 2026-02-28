export class RoundError extends Error {
	constructor(message: string = "Round error") {
		super(message);
	}
}
export class WordInRoundNotFound extends RoundError {
	constructor(wordId: string) {
		super(`Word with ID ${wordId} was not found in the round`);
	}
}

export class UserIsNotGuesser extends RoundError {
	constructor(userId: string) {
		super(`User with ID ${userId} is not a guesser!`);
	}
}
export class RoundIsNotInProgress extends RoundError {
	constructor() {
		super(`Round is not in progress!`);
	}
}
export class RoundIsNotFinished extends RoundError {
	constructor() {
		super(`Round is not finished!`);
	}
}
export class RoundAlreadyStarted extends RoundError {
	constructor() {
		super(`Round already started!`);
	}
}
export class RoundNotActiveError extends RoundError {
	constructor() {
		super("No active round");
	}
}
export class RoundAlreadyActiveError extends RoundError {
	constructor() {
		super("A round is already active");
	}
}
