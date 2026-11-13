import { v4 as uuidv4 } from "uuid";
import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type {
	AddTeamAction,
	DeleteTeamAction,
	MoveToTeamAction,
	MoveToSpectatorsAction,
} from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import {
	RoundStatus,
	type GameState,
	type PlayerState,
	type TeamState,
} from "../../../state/game.state";
import { TeamCreatedDomainEvent } from "../../../events/game.events";
import {
	GameNotInLobbyError,
	NotEnoughTeamsError,
	NotRoomOwnerOnlyDuringGameError,
	PlayerNotFoundError,
	PlayerNotRoomOwnerError,
	TeamNameExistsError,
} from "../../../errors/game.errors";
import {
	ExplainerCannotBeMovedError,
	TeamIsPlayingError,
	TeamNotFoundError,
} from "../../../errors/team.errors";
import { handlePlayerDepartureSideEffects } from "./lobby.helpers";

export class AddTeamStrategy implements ActionStrategy<AddTeamAction> {
	readonly actionType = "ADD_TEAM" as const;

	handle(action: AddTeamAction, ctx: ActionContext): void {
		const { state, emit } = ctx;

		if (state.status === "FINISHED") {
			throw new GameNotInLobbyError(
				"Cannot add team: game is already finished",
			);
		}
		if (action.actorId && action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError("Only room owner can add teams");
		}

		const payload = action.payload;
		if (
			state.teams.some(
				(t) => t.name.toLowerCase() === payload.name.toLowerCase(),
			)
		) {
			throw new TeamNameExistsError(
				payload.name,
				`Team name "${payload.name}" is already taken`,
			);
		}

		const DEFAULT_COLORS = [
			"#FF5733",
			"#33FF57",
			"#3357FF",
			"#F3FF33",
			"#FF33F3",
			"#33FFF3",
		];
		const assignedColor =
			payload.color ||
			DEFAULT_COLORS[state.teams.length % DEFAULT_COLORS.length];

		const newTeam: TeamState = {
			id: payload.teamId || uuidv4(),
			name: payload.name,
			color: assignedColor,
			score: 0,
		};

		state.teams.push(newTeam);
		emit(new TeamCreatedDomainEvent(state.id, newTeam));
	}
}

export class DeleteTeamStrategy implements ActionStrategy<DeleteTeamAction> {
	readonly actionType = "DELETE_TEAM" as const;

	handle(action: DeleteTeamAction, ctx: ActionContext): void {
		const { state } = ctx;

		if (action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError();
		}

		const { teamId } = action.payload;
		const team = state.teams.some((t) => t.id === teamId);
		if (!team) {
			throw new TeamNotFoundError(teamId);
		}

		if (state.status !== "LOBBY") {
			if (state.teams.length <= 2) {
				throw new NotEnoughTeamsError(
					"Cannot delete team: minimum 2 teams required to continue the game",
				);
			}
			const isPlaying =
				state.currentRound &&
				(state.activeTeamId === teamId ||
					state.currentRound.teamId === teamId);
			if (isPlaying) {
				const teamToFind = state.teams.find((t) => t.id === teamId);
				throw new TeamIsPlayingError(teamId, teamToFind?.name);
			}
		}

		state.teams = state.teams.filter((t) => t.id !== teamId);
		state.spectators ??= [];
		for (const player of state.players) {
			if (player.teamId === teamId) {
				player.teamId = undefined;
				player.isReady = false;
				player.isRoundReady = false;
				if (!state.spectators.includes(player.id)) {
					state.spectators.push(player.id);
				}
			}
		}
	}
}

export class MoveToTeamStrategy implements ActionStrategy<MoveToTeamAction> {
	readonly actionType = "MOVE_TO_TEAM" as const;

	handle(action: MoveToTeamAction, ctx: ActionContext): void {
		const { state } = ctx;
		const { playerId, teamId } = action.payload;

		this.assertActorCanMovePlayer(state, action.actorId, playerId);

		const player = state.players.find((p) => p.id === playerId);
		if (!player) {
			throw new PlayerNotFoundError(playerId);
		}

		this.assertNotActiveExplainer(state, playerId, player.name);

		const targetTeam = state.teams.find((t) => t.id === teamId);
		if (!targetTeam) {
			throw new TeamNotFoundError(teamId);
		}

		this.removePlayerFromPreviousLocations(state, playerId);
		this.assignPlayerToTeam(player, targetTeam, playerId);
	}

	private assertActorCanMovePlayer(
		state: GameState,
		actorId?: string,
		playerId?: string,
	): void {
		if (state.status !== "LOBBY") {
			if (actorId !== state.ownerId) {
				throw new NotRoomOwnerOnlyDuringGameError();
			}
			return;
		}

		if (actorId && actorId !== playerId && actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError();
		}
	}

	private assertNotActiveExplainer(
		state: GameState,
		playerId: string,
		playerName: string,
	): void {
		const round = state.currentRound;
		const isRoundExplaining =
			round?.status === RoundStatus.IN_PROGRESS ||
			round?.status === RoundStatus.POINTING;

		if (round?.explainerId === playerId && isRoundExplaining) {
			throw new ExplainerCannotBeMovedError(
				playerId,
				playerName,
				round.id,
			);
		}
	}

	private removePlayerFromPreviousLocations(
		state: GameState,
		playerId: string,
	): void {
		for (const team of state.teams) {
			if (team.playerIds) {
				team.playerIds = team.playerIds.filter((id) => id !== playerId);
			}
		}
		if (state.spectators) {
			state.spectators = state.spectators.filter((id) => id !== playerId);
		}
	}

	private assignPlayerToTeam(
		player: PlayerState,
		targetTeam: TeamState,
		playerId: string,
	): void {
		player.teamId = targetTeam.id;
		targetTeam.playerIds ??= [];
		if (!targetTeam.playerIds.includes(playerId)) {
			targetTeam.playerIds.push(playerId);
		}
	}
}

export class MoveToSpectatorsStrategy implements ActionStrategy<MoveToSpectatorsAction> {
	readonly actionType = "MOVE_TO_SPECTATORS" as const;

	handle(action: MoveToSpectatorsAction, ctx: ActionContext): void {
		const { state } = ctx;
		const { playerId } = action.payload;

		if (state.status !== "LOBBY") {
			if (action.actorId !== state.ownerId) {
				throw new NotRoomOwnerOnlyDuringGameError();
			}
		} else if (
			action.actorId &&
			action.actorId !== playerId &&
			action.actorId !== state.ownerId
		) {
			throw new PlayerNotRoomOwnerError();
		}

		const player = state.players.find((p) => p.id === playerId);
		if (!player) {
			throw new PlayerNotFoundError(playerId);
		}

		if (
			state.currentRound?.explainerId === playerId &&
			(state.currentRound.status === RoundStatus.IN_PROGRESS ||
				state.currentRound.status === RoundStatus.POINTING)
		) {
			throw new ExplainerCannotBeMovedError(
				playerId,
				player.name,
				state.currentRound.id,
			);
		}

		for (const team of state.teams) {
			if (team.playerIds) {
				team.playerIds = team.playerIds.filter((id) => id !== playerId);
			}
			if (team.lastExplainerId === playerId) {
				team.lastExplainerId = null;
			}
		}
		player.teamId = undefined;
		player.isReady = false;
		player.isRoundReady = false;

		state.spectators ??= [];
		if (!state.spectators.includes(playerId)) {
			state.spectators.push(playerId);
		}

		const now = ctx.now ?? Date.now();
		handlePlayerDepartureSideEffects(state, playerId, now);
	}
}
