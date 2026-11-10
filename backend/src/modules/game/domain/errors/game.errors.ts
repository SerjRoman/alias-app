import { GameErrorCode } from "./error-codes";

export class GameError extends Error {
	constructor(
		message: string,
		public readonly code: GameErrorCode = GameErrorCode.INTERNAL_ERROR,
		public readonly details?: Record<string, unknown>,
	) {
		super(message);
		this.name = this.constructor.name;
	}
}

export class RoomNotFoundError extends GameError {
	constructor(public readonly roomId: string) {
		super(
			`Room with ID ${roomId} not found`,
			GameErrorCode.ROOM_NOT_FOUND,
			{ roomId },
		);
	}
}

export class PlayerNotRoomOwnerError extends GameError {
	constructor(message = "User is not the owner of the room") {
		super(message, GameErrorCode.PLAYER_NOT_ROOM_OWNER);
	}
}

export class NotRoundExplainerError extends GameError {
	constructor(message = "User is not the round explainer") {
		super(message, GameErrorCode.NOT_ROUND_EXPLAINER);
	}
}

export class NotInGameError extends GameError {
	constructor(message = "User is not in the game room") {
		super(message, GameErrorCode.NOT_IN_GAME);
	}
}

export class PlayerAlreadyInGameError extends GameError {
	constructor(public readonly playerId: string) {
		super(
			`Player with ID ${playerId} is already in the game room`,
			GameErrorCode.PLAYER_ALREADY_IN_GAME,
			{ playerId },
		);
	}
}

export class NegativePointsError extends GameError {
	constructor(public readonly points: number) {
		super(
			`Points cannot be negative: ${points}`,
			GameErrorCode.NEGATIVE_POINTS,
			{ points },
		);
	}
}

export class GameInProgressError extends GameError {
	constructor(message = "Cannot change settings while game is in progress") {
		super(message, GameErrorCode.GAME_IN_PROGRESS);
	}
}

export class GameNotInProgressError extends GameError {
	constructor(message = "Game is not in progress") {
		super(message, GameErrorCode.GAME_NOT_IN_PROGRESS);
	}
}

export class TeamNameExistsError extends GameError {
	constructor(
		public readonly teamName: string,
		message?: string,
	) {
		super(
			message ?? `Team name already exists: ${teamName}`,
			GameErrorCode.TEAM_NAME_EXISTS,
			{ teamName },
		);
	}
}

export class PlayerNotFoundError extends GameError {
	constructor(
		public readonly playerId: string,
		message?: string,
	) {
		super(
			message ?? `Player with ID ${playerId} not found in game room`,
			GameErrorCode.PLAYER_NOT_FOUND,
			{ playerId },
		);
	}
}

export class PlayersNotReadyError extends GameError {
	constructor(message = "Not all players are ready") {
		super(message, GameErrorCode.PLAYERS_NOT_READY);
	}
}

export class InvalidGameCode extends GameError {
	constructor(message = "Code is invalid") {
		super(message, GameErrorCode.INVALID_GAME_CODE);
	}
}

export class GameNotFinishedError extends GameError {
	constructor(message = "Game is not finished yet") {
		super(message, GameErrorCode.GAME_NOT_FINISHED);
	}
}

export class GameNotInLobbyError extends GameError {
	constructor(message = "Game is not in lobby") {
		super(message, GameErrorCode.GAME_NOT_IN_LOBBY);
	}
}

export class VoiceChatDisabledError extends GameError {
	constructor(message = "Voice chat is disabled for this game room") {
		super(message, GameErrorCode.VOICE_CHAT_DISABLED);
	}
}

export class PlayerPermanentlyKickedError extends GameError {
	constructor(message = "Player is permanently kicked from this game room") {
		super(message, GameErrorCode.PLAYER_PERMANENTLY_KICKED);
	}
}

export class NotEnoughTeamsError extends GameError {
	constructor(message = "Need at least 2 teams to start the game") {
		super(message, GameErrorCode.NOT_ENOUGH_TEAMS);
	}
}

export class HatModeDisabledError extends GameError {
	constructor(message = "Hat mode is not enabled in this room") {
		super(message, GameErrorCode.HAT_MODE_DISABLED);
	}
}

export class WordsPerPlayerNotConfiguredError extends GameError {
	constructor(message = "Please configure the number of words per player") {
		super(message, GameErrorCode.WORDS_PER_PLAYER_NOT_CONFIGURED);
	}
}

export class InvalidSubmittedWordsCountError extends GameError {
	constructor(
		public readonly expected: number,
		public readonly received: number,
	) {
		super(
			`You must submit exactly ${expected} words (received ${received})`,
			GameErrorCode.INVALID_SUBMITTED_WORDS_COUNT,
			{ expected, received },
		);
	}
}

export class PlayersWordsNotSubmittedError extends GameError {
	constructor(
		public readonly wordsNeeded: number,
		public readonly playerNames: string[],
	) {
		super(
			`All team players must submit exactly ${wordsNeeded} words to start. Not submitted: ${playerNames.join(", ")}`,
			GameErrorCode.PLAYERS_WORDS_NOT_SUBMITTED,
			{ wordsNeeded, playerNames },
		);
	}
}

export class ActionBlockedByEffectError extends GameError {
	constructor(
		message = "Action denied: Explainer is frozen from cycling words",
	) {
		super(message, GameErrorCode.ACTION_BLOCKED_BY_EFFECT);
	}
}

export class NoWordsAvailableError extends GameError {
	constructor(message = "Unexpected error: no words available for the game") {
		super(message, GameErrorCode.NO_WORDS_AVAILABLE);
	}
}

export class NotRoomOwnerOnlyDuringGameError extends GameError {
	constructor(
		message = "Only the room owner can manage teams and players during an active game",
	) {
		super(message, GameErrorCode.NOT_ROOM_OWNER_ONLY_DURING_GAME);
	}
}
