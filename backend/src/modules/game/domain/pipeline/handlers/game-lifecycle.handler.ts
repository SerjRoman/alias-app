import { v4 as uuidv4 } from "uuid";
import type { ActionContext, GamePipelineHandler } from "../pipeline.types";
import { RoundStatus, type RoundState } from "../../state/game.state";
import {
	GameDeletedDomainEvent,
	GameFinishedDomainEvent,
	GameStartedDomainEvent,
} from "../../events/game.events";
import {
	GameNotFinishedError,
	GameNotInLobbyError,
	GameNotInProgressError,
	NotEnoughTeamsError,
	PlayerNotRoomOwnerError,
	PlayersNotReadyError,
	PlayersWordsNotSubmittedError,
} from "../../errors/game.errors";
import { TeamIsEmptyError } from "../../errors/team.errors";

/**
 * Standard game lifecycle pipeline handler.
 * Manages game-level state transitions: START_GAME, END_GAME, and DELETE_GAME.
 */
export const gameLifecycleHandler: GamePipelineHandler = (
	ctx: ActionContext,
) => {
	const { action, state, emit } = ctx;

	if (
		action.type !== "START_GAME" &&
		action.type !== "END_GAME" &&
		action.type !== "DELETE_GAME"
	) {
		return;
	}

	// 1. START_GAME: Validates lobby requirements and launches the match
	if (action.type === "START_GAME") {
		if (state.status !== "LOBBY") {
			throw new GameNotInLobbyError(
				"Game can only be started from LOBBY",
			);
		}

		if (action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError(
				"Only the room owner can start the game",
			);
		}

		if (state.teams.length < 2) {
			throw new NotEnoughTeamsError(
				"Need at least 2 teams to start the game",
			);
		}

		const getPlayersForTeam = (teamId: string, playerIds?: string[]) =>
			state.players.filter(
				(p) =>
					p.teamId === teamId || Boolean(playerIds?.includes(p.id)),
			);

		// Ensure every team has at least one player
		for (const team of state.teams) {
			const teamPlayers = getPlayersForTeam(team.id, team.playerIds);
			if (teamPlayers.length === 0) {
				throw new TeamIsEmptyError(
					"All teams must have at least one player",
				);
			}
		}

		// Ensure all players assigned to teams are ready
		const assignedPlayerIds = new Set(
			state.teams.flatMap((t) =>
				getPlayersForTeam(t.id, t.playerIds).map((p) => p.id),
			),
		);
		const teamPlayers = state.players.filter((p) =>
			assignedPlayerIds.has(p.id),
		);
		const allReady = teamPlayers.every((p) => p.isReady);
		if (!allReady) {
			throw new PlayersNotReadyError(
				"All team players must be ready to start",
			);
		}

		if (state.settings?.isHatMode) {
			const wordsNeeded = state.settings.wordsPerPlayer ?? 0;
			const playersWithNotEnoughWords = teamPlayers.filter(
				(p) => (p.submittedWordsCount ?? 0) !== wordsNeeded,
			);
			if (playersWithNotEnoughWords.length > 0) {
				throw new PlayersWordsNotSubmittedError(
					wordsNeeded,
					playersWithNotEnoughWords.map((p) => p.name),
				);
			}
		}

		if (state.spectators !== undefined) {
			for (const player of state.players) {
				if (
					!assignedPlayerIds.has(player.id) &&
					!state.spectators.includes(player.id)
				) {
					state.spectators.push(player.id);
				}
			}
		}

		// Transition game to IN_PROGRESS
		state.status = "IN_PROGRESS";
		const firstTeam = state.teams[0];
		state.activeTeamId = firstTeam.id;
		state.lastTeamPlayedIndex = 0;

		const firstTeamPlayers = getPlayersForTeam(
			firstTeam.id,
			firstTeam.playerIds,
		);
		const initialExplainerId =
			firstTeamPlayers.length > 0 ? firstTeamPlayers[0].id : "";

		firstTeam.lastExplainerId = initialExplainerId || null;

		const initialRound: RoundState = {
			id: uuidv4(),
			explainerId: initialExplainerId,
			teamId: firstTeam.id,
			status: RoundStatus.PENDING,
			currentWord: null,
			words: [],
			roundNumber: 1,
			endTime: 0,
		};

		state.currentRound = initialRound;

		emit(new GameStartedDomainEvent(state.id, initialRound));
		return;
	}

	// 2. END_GAME: Terminates match and resolves final winner
	if (action.type === "END_GAME") {
		if (state.status !== "IN_PROGRESS") {
			throw new GameNotInProgressError(
				"Cannot end game: game is not IN_PROGRESS",
			);
		}

		if (action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError(
				"Only the room owner can end the game",
			);
		}

		state.status = "FINISHED";
		state.currentRound = null;

		// Calculate winner team with the highest score
		let winnerTeamId: string | null = null;
		if (state.teams.length > 0) {
			const sorted = [...state.teams].sort((a, b) => b.score - a.score);
			winnerTeamId = sorted[0].id;
		}
		state.winnerTeamId = winnerTeamId;

		emit(new GameFinishedDomainEvent(state.id, winnerTeamId, state.teams));
		return;
	}

	// 3. DELETE_GAME: Validates ownership (and optional finished state) and emits GameDeletedDomainEvent
	if (action.type === "DELETE_GAME") {
		if (action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError();
		}

		const payload = action.payload as
			| { requireFinished?: boolean }
			| undefined;
		if (payload?.requireFinished && state.status !== "FINISHED") {
			throw new GameNotFinishedError();
		}

		emit(
			new GameDeletedDomainEvent(
				state.id,
				state.players.map((p) => p.id),
			),
		);
	}
};
