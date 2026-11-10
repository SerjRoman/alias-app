import { GameError } from "./game.errors";
import { GameErrorCode } from "./error-codes";

export class TeamError extends GameError {
	constructor(
		message: string,
		code: GameErrorCode = GameErrorCode.INTERNAL_ERROR,
		details?: Record<string, unknown>,
	) {
		super(message, code, details);
	}
}

export class TeamNotFoundError extends TeamError {
	constructor(public readonly teamId: string) {
		super(
			`Team with id ${teamId} not found`,
			GameErrorCode.TEAM_NOT_FOUND,
			{ teamId },
		);
	}
}

export class NoActiveTeamError extends TeamError {
	constructor(message = "No active team set for scoring") {
		super(message, GameErrorCode.NO_ACTIVE_TEAM);
	}
}

export class TeamIsEmptyError extends TeamError {
	constructor(
		message = "Team is empty",
		public readonly teamId?: string,
		public readonly teamName?: string,
	) {
		super(
			message,
			GameErrorCode.TEAM_IS_EMPTY,
			teamId || teamName ? { teamId, teamName } : undefined,
		);
	}
}

export class TeamNameEmptyError extends TeamError {
	constructor(message = "Team name is empty") {
		super(message, GameErrorCode.TEAM_NAME_EMPTY);
	}
}

export class PlayerAlreadyInTeamError extends TeamError {
	constructor(
		public readonly playerId?: string,
		public readonly teamId?: string,
		message = "Player is already in the team",
	) {
		super(
			message,
			GameErrorCode.PLAYER_ALREADY_IN_TEAM,
			playerId || teamId ? { playerId, teamId } : undefined,
		);
	}
}

export class TeamHasNoOnlinePlayersError extends TeamError {
	constructor(
		public readonly teamId: string,
		public readonly teamName?: string,
		message?: string,
	) {
		super(
			message ??
				(teamName
					? `Team "${teamName}" has no online players`
					: `Team ${teamId} has no online players`),
			GameErrorCode.TEAM_HAS_NO_ONLINE_PLAYERS,
			{ teamId, teamName },
		);
	}
}

export class TeamIsPlayingError extends TeamError {
	constructor(
		public readonly teamId: string,
		public readonly teamName?: string,
		message?: string,
	) {
		super(
			message ??
				(teamName
					? `Cannot delete team "${teamName}": team is currently playing in active round`
					: `Cannot delete team ${teamId}: team is currently playing in active round`),
			GameErrorCode.TEAM_IS_PLAYING,
			{ teamId, teamName },
		);
	}
}

export class ExplainerCannotBeMovedError extends TeamError {
	constructor(
		public readonly playerId: string,
		public readonly playerName?: string,
		public readonly roundId?: string,
		message?: string,
	) {
		super(
			message ??
				`Cannot move player ${playerName ? `"${playerName}"` : playerId}: player is currently explaining words in active round`,
			GameErrorCode.EXPLAINER_CANNOT_BE_MOVED,
			{ playerId, playerName, roundId },
		);
	}
}
