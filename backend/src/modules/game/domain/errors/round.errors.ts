import { GameError } from "./game.errors";
import { GameErrorCode } from "./error-codes";

export class RoundError extends GameError {
	constructor(
		message = "Round error",
		code: GameErrorCode = GameErrorCode.ROUND_ERROR,
		details?: Record<string, unknown>,
	) {
		super(message, code, details);
	}
}

export class WordInRoundNotFound extends RoundError {
	constructor(
		public readonly wordId: string,
		message?: string,
	) {
		super(
			message ?? `Word with ID ${wordId} was not found in the round`,
			GameErrorCode.WORD_IN_ROUND_NOT_FOUND,
			{ wordId },
		);
	}
}

export class NoActiveWordError extends RoundError {
	constructor(message = "No active word to score") {
		super(message, GameErrorCode.NO_ACTIVE_WORD);
	}
}

export class UserIsNotExplainerError extends RoundError {
	constructor(
		public readonly userId?: string,
		message?: string,
	) {
		super(
			message ??
				(userId
					? `User with ID ${userId} is not the round explainer!`
					: "Only the round explainer can cycle words"),
			GameErrorCode.USER_IS_NOT_EXPLAINER,
			userId ? { userId } : undefined,
		);
	}
}

export class RoundIsNotInProgress extends RoundError {
	constructor(message = "Round is not in progress!") {
		super(message, GameErrorCode.ROUND_IS_NOT_IN_PROGRESS);
	}
}

export class RoundIsNotPending extends RoundError {
	constructor(message = "Round is not pending!") {
		super(message, GameErrorCode.ROUND_IS_NOT_PENDING);
	}
}

export class RoundIsNotPointing extends RoundError {
	constructor(message = "Round is not in pointing mode!") {
		super(message, GameErrorCode.ROUND_IS_NOT_POINTING);
	}
}

export class RoundIsNotFinished extends RoundError {
	constructor(message = "Round is not finished!") {
		super(message, GameErrorCode.ROUND_IS_NOT_FINISHED);
	}
}

export class RoundAlreadyStarted extends RoundError {
	constructor(message = "Round already started!") {
		super(message, GameErrorCode.ROUND_ALREADY_STARTED);
	}
}

export class RoundNotActiveError extends RoundError {
	constructor(message = "No active round") {
		super(message, GameErrorCode.ROUND_NOT_ACTIVE);
	}
}

export class RoundAlreadyActiveError extends RoundError {
	constructor(message = "A round is already active") {
		super(message, GameErrorCode.ROUND_ALREADY_ACTIVE);
	}
}
