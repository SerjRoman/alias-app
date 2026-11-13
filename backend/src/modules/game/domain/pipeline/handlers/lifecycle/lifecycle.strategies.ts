import { v4 as uuidv4 } from "uuid";
import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type {
	StartGameAction,
	EndGameAction,
	DeleteGameAction,
} from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import { RoundStatus, type RoundState } from "../../../state/game.state";
import {
	GameStartedDomainEvent,
	GameFinishedDomainEvent,
	GameDeletedDomainEvent,
} from "../../../events/game.events";
import {
	GameNotInLobbyError,
	GameNotInProgressError,
	GameNotFinishedError,
	NotEnoughTeamsError,
	PlayerNotRoomOwnerError,
	PlayersNotReadyError,
	PlayersWordsNotSubmittedError,
} from "../../../errors/game.errors";
import { TeamIsEmptyError } from "../../../errors/team.errors";

export class StartGameStrategy implements ActionStrategy<StartGameAction> {
	readonly actionType = "START_GAME" as const;

	handle(action: StartGameAction, ctx: ActionContext): void {
		const { state, emit } = ctx;

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

		for (const team of state.teams) {
			const teamPlayers = getPlayersForTeam(team.id, team.playerIds);
			if (teamPlayers.length === 0) {
				throw new TeamIsEmptyError(
					"All teams must have at least one player",
				);
			}
		}

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
			expiresAt: 0,
		};

		state.currentRound = initialRound;
		emit(new GameStartedDomainEvent(state.id, initialRound));
	}
}

export class EndGameStrategy implements ActionStrategy<EndGameAction> {
	readonly actionType = "END_GAME" as const;

	handle(action: EndGameAction, ctx: ActionContext): void {
		const { state, emit } = ctx;

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

		let winnerTeamId: string | null = null;
		if (state.teams.length > 0) {
			const sorted = [...state.teams].sort((a, b) => b.score - a.score);
			winnerTeamId = sorted[0].id;
		}
		state.winnerTeamId = winnerTeamId;

		emit(new GameFinishedDomainEvent(state.id, winnerTeamId, state.teams));
	}
}

export class DeleteGameStrategy implements ActionStrategy<DeleteGameAction> {
	readonly actionType = "DELETE_GAME" as const;

	handle(action: DeleteGameAction, ctx: ActionContext): void {
		const { state, emit } = ctx;

		if (action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError();
		}

		const payload = action.payload;
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
}
