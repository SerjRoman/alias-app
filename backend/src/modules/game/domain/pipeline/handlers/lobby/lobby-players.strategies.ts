import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type {
	JoinGameAction,
	LeaveGameAction,
	KickPlayerAction,
	ToggleReadyAction,
	SetPlayerOfflineAction,
	ShufflePlayersAction,
} from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import { RoundStatus } from "../../../state/game.state";
import {
	PlayerKickedDomainEvent,
	PlayerReadyToggledDomainEvent,
} from "../../../events/game.events";
import {
	GameNotInLobbyError,
	PlayerNotFoundError,
	PlayerNotRoomOwnerError,
	PlayerPermanentlyKickedError,
} from "../../../errors/game.errors";
import { TeamError } from "../../../errors/team.errors";
import { pauseTimer } from "../../../time";
import {
	handlePlayerDepartureSideEffects,
	resumeRoundIfExplainer,
	transferOwnershipOnLeave,
} from "./lobby.helpers";

export class JoinGameStrategy implements ActionStrategy<JoinGameAction> {
	readonly actionType = "JOIN_GAME" as const;

	handle(action: JoinGameAction, ctx: ActionContext): void {
		const { state } = ctx;
		const payload = action.payload;

		if (state.bannedPlayerIds?.includes(payload.playerId)) {
			throw new PlayerPermanentlyKickedError();
		}

		const existingPlayer = state.players.find(
			(p) => p.id === payload.playerId,
		);
		if (existingPlayer) {
			existingPlayer.isOnline = true;
			const now = ctx.now ?? Date.now();
			if (state.ownerId === existingPlayer.id) {
				state.ownerOfflineSince = null;
			}
			resumeRoundIfExplainer(state.currentRound, existingPlayer.id, now);
			return;
		}

		state.players.push({
			id: payload.playerId,
			name: payload.name,
			role: payload.role ?? "anonymous",
			isReady: false,
			isRoundReady: false,
			score: 0,
			isOnline: true,
			submittedWordsCount: 0,
		});

		state.spectators ??= [];
		if (!state.spectators.includes(payload.playerId)) {
			state.spectators.push(payload.playerId);
		}
	}
}

export class LeaveGameStrategy implements ActionStrategy<LeaveGameAction> {
	readonly actionType = "LEAVE_GAME" as const;

	handle(action: LeaveGameAction, ctx: ActionContext): void {
		const { state } = ctx;
		const playerId = action.payload?.playerId ?? action.actorId ?? "";
		const player = state.players.find((p) => p.id === playerId);
		if (!player) {
			throw new PlayerNotFoundError(playerId);
		}

		const now = ctx.now ?? Date.now();

		if (state.status !== "LOBBY") {
			state.leftPlayers ??= [];
			state.leftPlayers.push({
				id: player.id,
				name: player.name,
				teamId: player.teamId ?? null,
				score: player.score ?? 0,
				leftAt: now,
			});
		}

		state.players = state.players.filter((p) => p.id !== playerId);
		for (const team of state.teams) {
			if (team.playerIds) {
				team.playerIds = team.playerIds.filter((id) => id !== playerId);
			}
			if (team.lastExplainerId === playerId) {
				team.lastExplainerId = null;
			}
		}
		if (state.spectators) {
			state.spectators = state.spectators.filter((id) => id !== playerId);
		}

		transferOwnershipOnLeave(state, playerId);
		handlePlayerDepartureSideEffects(state, playerId, now);
	}
}

export class KickPlayerStrategy implements ActionStrategy<KickPlayerAction> {
	readonly actionType = "KICK_PLAYER" as const;

	handle(action: KickPlayerAction, ctx: ActionContext): void {
		const { state, emit } = ctx;

		if (action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError(
				"Only room owner can kick players",
			);
		}

		const { targetPlayerId, isPermanent } = action.payload;

		const player = state.players.find((p) => p.id === targetPlayerId);
		if (player && state.status !== "LOBBY") {
			state.leftPlayers ??= [];
			state.leftPlayers.push({
				id: player.id,
				name: player.name,
				teamId: player.teamId ?? null,
				score: player.score ?? 0,
				leftAt: Date.now(),
			});
		}

		state.players = state.players.filter((p) => p.id !== targetPlayerId);
		for (const team of state.teams) {
			if (team.playerIds) {
				team.playerIds = team.playerIds.filter(
					(id) => id !== targetPlayerId,
				);
			}
			if (team.lastExplainerId === targetPlayerId) {
				team.lastExplainerId = null;
			}
		}
		if (state.spectators) {
			state.spectators = state.spectators.filter(
				(id) => id !== targetPlayerId,
			);
		}

		const now = ctx.now ?? Date.now();
		handlePlayerDepartureSideEffects(state, targetPlayerId, now);

		if (isPermanent && !state.bannedPlayerIds.includes(targetPlayerId)) {
			state.bannedPlayerIds.push(targetPlayerId);
		}

		emit(
			new PlayerKickedDomainEvent(
				state.id,
				targetPlayerId,
				Boolean(isPermanent),
			),
		);
	}
}

export class ToggleReadyStrategy implements ActionStrategy<ToggleReadyAction> {
	readonly actionType = "TOGGLE_READY" as const;

	handle(action: ToggleReadyAction, ctx: ActionContext): void {
		const { state, emit } = ctx;

		if (state.status !== "LOBBY") {
			throw new GameNotInLobbyError(
				"Cannot toggle ready: game not in lobby",
			);
		}

		const { playerId } = action.payload;
		const player = state.players.find((p) => p.id === playerId);
		if (!player) {
			throw new PlayerNotFoundError(
				playerId,
				`Player ${playerId} not found`,
			);
		}

		player.isReady = !player.isReady;
		emit(
			new PlayerReadyToggledDomainEvent(
				state.id,
				playerId,
				player.isReady,
			),
		);
	}
}

export class SetPlayerOfflineStrategy implements ActionStrategy<SetPlayerOfflineAction> {
	readonly actionType = "SET_PLAYER_OFFLINE" as const;

	handle(action: SetPlayerOfflineAction, ctx: ActionContext): void {
		const { state } = ctx;
		const playerId = action.payload?.playerId ?? action.actorId ?? "";
		const player = state.players.find((p) => p.id === playerId);
		if (!player) {
			throw new PlayerNotFoundError(playerId);
		}

		player.isOnline = false;
		const now = ctx.now ?? Date.now();

		if (state.ownerId === playerId) {
			state.ownerOfflineSince = now;
		}

		const round = state.currentRound;
		if (
			round?.explainerId === playerId &&
			round.status === RoundStatus.IN_PROGRESS
		) {
			pauseTimer(round, now);
		}
	}
}

export class ShufflePlayersStrategy implements ActionStrategy<ShufflePlayersAction> {
	readonly actionType = "SHUFFLE_PLAYERS" as const;

	handle(action: ShufflePlayersAction, ctx: ActionContext): void {
		const { state } = ctx;

		if (action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError();
		}
		if (state.status !== "LOBBY") {
			throw new GameNotInLobbyError();
		}
		if (state.teams.length === 0) {
			throw new TeamError("Need at least 1 team to shuffle players");
		}

		const shuffledPlayers = [...state.players];
		for (let i = shuffledPlayers.length - 1; i > 0; i -= 1) {
			const randomIndex = Math.floor(Math.random() * (i + 1));
			[shuffledPlayers[i], shuffledPlayers[randomIndex]] = [
				shuffledPlayers[randomIndex],
				shuffledPlayers[i],
			];
		}

		for (const team of state.teams) {
			team.playerIds = [];
		}
		state.spectators = [];

		shuffledPlayers.forEach((player, index) => {
			const team = state.teams[index % state.teams.length];
			player.teamId = team.id;
			team.playerIds ??= [];
			team.playerIds.push(player.id);
		});
	}
}
