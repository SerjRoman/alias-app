import { v4 as uuidv4 } from "uuid";
import type { ActionContext, GamePipelineHandler } from "../pipeline.types";
import {
	OWNER_OFFLINE_TIMEOUT_MS,
	type GameSettingsState,
	type TeamState,
} from "../../state/game.state";
import {
	PlayerKickedDomainEvent,
	PlayerReadyToggledDomainEvent,
	TeamCreatedDomainEvent,
} from "../../events/game.events";
import {
	GameNotInLobbyError,
	HatModeDisabledError,
	InvalidSubmittedWordsCountError,
	NotEnoughTeamsError,
	NotRoomOwnerOnlyDuringGameError,
	PlayerNotFoundError,
	PlayerNotRoomOwnerError,
	PlayerPermanentlyKickedError,
	TeamNameExistsError,
	WordsPerPlayerNotConfiguredError,
} from "../../errors/game.errors";
import {
	ExplainerCannotBeMovedError,
	TeamError,
	TeamIsPlayingError,
	TeamNotFoundError,
} from "../../errors/team.errors";

/**
 * Standard lobby pipeline handler.
 * Handles player join/leave/online/offline, room settings, custom words,
 * team management, player ready toggles, and host kick/ban actions.
 */
export const lobbyHandler: GamePipelineHandler = (ctx: ActionContext) => {
	const { action, state, emit } = ctx;

	// 1. JOIN_GAME
	if (action.type === "JOIN_GAME") {
		const payload = action.payload as {
			playerId: string;
			name: string;
			role?: "registered" | "anonymous";
		};

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
			const currentRound = state.currentRound;
			if (
				currentRound?.explainerId === existingPlayer.id &&
				currentRound.pausedAt !== null &&
				currentRound.pausedAt !== undefined
			) {
				const remaining = currentRound.remainingMs ?? 0;
				currentRound.endTime = now + remaining;
				currentRound.pausedAt = null;
				currentRound.remainingMs = null;
			}
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
		return;
	}

	// 2. LEAVE_GAME
	if (action.type === "LEAVE_GAME") {
		const payload = action.payload as { playerId?: string } | undefined;
		const playerId = payload?.playerId ?? action.actorId ?? "";
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

		// Owner transfer on leave
		if (state.ownerId === playerId) {
			const onlineTeamPlayer = state.players.find(
				(p) => p.isOnline !== false && p.teamId,
			);
			const onlineSpectator = state.players.find(
				(p) => p.isOnline !== false,
			);
			const newOwner = onlineTeamPlayer ?? onlineSpectator;
			if (newOwner) {
				state.ownerId = newOwner.id;
				state.ownerOfflineSince = null;
			}
		}

		// If current explainer left, pause round
		const round = state.currentRound;
		if (round?.explainerId === playerId && round.status === "IN_PROGRESS") {
			round.pausedAt = now;
			round.remainingMs = Math.max(0, round.endTime - now);
		}

		// If active playing team became completely empty, finish round
		if (round?.status === "IN_PROGRESS") {
			const activeTeam = state.teams.find((t) => t.id === round.teamId);
			if (
				activeTeam &&
				(!activeTeam.playerIds || activeTeam.playerIds.length === 0)
			) {
				round.status = "FINISHED";
			}
		}

		return;
	}

	// 3. SET_PLAYER_OFFLINE
	if (action.type === "SET_PLAYER_OFFLINE") {
		const payload = action.payload as { playerId?: string } | undefined;
		const playerId = payload?.playerId ?? action.actorId ?? "";
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
		if (round?.explainerId === playerId && round.status === "IN_PROGRESS") {
			round.pausedAt = now;
			round.remainingMs = Math.max(0, round.endTime - now);
		}
		return;
	}

	// 3.5. TRANSFER_OWNERSHIP
	if (action.type === "TRANSFER_OWNERSHIP") {
		const payload = action.payload as
			| {
					newOwnerId?: string;
					targetPlayerId?: string;
					timeoutMs?: number;
			  }
			| undefined;
		const targetPlayerId = payload?.newOwnerId ?? payload?.targetPlayerId;

		if (targetPlayerId) {
			if (
				action.actorId !== state.ownerId &&
				action.actorId !== "system"
			) {
				throw new PlayerNotRoomOwnerError();
			}
			const target = state.players.find((p) => p.id === targetPlayerId);
			if (!target) {
				throw new PlayerNotFoundError(targetPlayerId);
			}
			state.ownerId = target.id;
			state.ownerOfflineSince = null;
			return;
		}

		// Automatic timeout transfer
		const owner = state.players.find((p) => p.id === state.ownerId);
		if (owner && owner.isOnline !== false) {
			state.ownerOfflineSince = null;
			return;
		}

		const now = ctx.now ?? Date.now();
		const timeout = payload?.timeoutMs ?? OWNER_OFFLINE_TIMEOUT_MS;

		if (
			state.ownerOfflineSince &&
			now - state.ownerOfflineSince < timeout
		) {
			return;
		}

		const onlineTeamPlayer = state.players.find(
			(p) => p.id !== state.ownerId && p.isOnline !== false && p.teamId,
		);
		const onlineSpectator = state.players.find(
			(p) => p.id !== state.ownerId && p.isOnline !== false,
		);
		const newOwner = onlineTeamPlayer ?? onlineSpectator;

		if (newOwner) {
			state.ownerId = newOwner.id;
			state.ownerOfflineSince = null;
		}
		return;
	}

	// 4. UPDATE_SETTINGS
	if (action.type === "UPDATE_SETTINGS") {
		if (action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError();
		}
		if (state.status !== "LOBBY") {
			throw new GameNotInLobbyError();
		}

		const newSettings = action.payload as Partial<GameSettingsState>;
		const currentSettings = state.settings ?? {};
		const hatModeChanged =
			newSettings.isHatMode !== undefined &&
			newSettings.isHatMode !== currentSettings.isHatMode;
		const wordsPerPlayerChanged =
			newSettings.wordsPerPlayer !== undefined &&
			newSettings.wordsPerPlayer !== currentSettings.wordsPerPlayer;

		state.settings = { ...currentSettings, ...newSettings };
		if (state.settings.isHatMode === false) {
			state.settings.wordsPerPlayer = 0;
		}
		if (newSettings.pointsToWin !== undefined) {
			state.pointsToWin = newSettings.pointsToWin;
		}
		if (newSettings.roundTimeSeconds !== undefined) {
			state.roundTimeSeconds = newSettings.roundTimeSeconds;
		}

		if (hatModeChanged || wordsPerPlayerChanged) {
			for (const p of state.players) {
				p.submittedWordsCount = 0;
			}
		}
		return;
	}

	// 5. SUBMIT_CUSTOM_WORDS
	if (action.type === "SUBMIT_CUSTOM_WORDS") {
		if (state.status !== "LOBBY") {
			throw new GameNotInLobbyError();
		}

		if (!state.settings?.isHatMode) {
			throw new HatModeDisabledError();
		}

		if (
			!state.settings.wordsPerPlayer ||
			state.settings.wordsPerPlayer <= 0
		) {
			throw new WordsPerPlayerNotConfiguredError();
		}

		const { wordsCount } = action.payload as { wordsCount: number };
		if (wordsCount !== state.settings.wordsPerPlayer) {
			throw new InvalidSubmittedWordsCountError(
				state.settings.wordsPerPlayer,
				wordsCount,
			);
		}

		const player = state.players.find((p) => p.id === action.actorId);
		if (!player) {
			throw new PlayerNotFoundError(action.actorId ?? "");
		}

		player.submittedWordsCount = wordsCount;
		return;
	}

	// 6. ADD_TEAM
	if (action.type === "ADD_TEAM") {
		if (state.status === "FINISHED") {
			throw new GameNotInLobbyError(
				"Cannot add team: game is already finished",
			);
		}

		if (action.actorId && action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError("Only room owner can add teams");
		}

		const payload = action.payload as {
			teamId?: string;
			name: string;
			color?: string;
		};

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
		return;
	}

	// 7. DELETE_TEAM
	if (action.type === "DELETE_TEAM") {
		if (action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError();
		}

		const { teamId } = action.payload as { teamId: string };
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
				const team = state.teams.find((t) => t.id === teamId);
				throw new TeamIsPlayingError(teamId, team?.name);
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
		return;
	}

	// 8. MOVE_TO_TEAM
	if (action.type === "MOVE_TO_TEAM") {
		const { playerId, teamId } = action.payload as {
			playerId: string;
			teamId: string;
		};

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
			state.currentRound &&
			state.currentRound.explainerId === playerId &&
			(state.currentRound.status === "IN_PROGRESS" ||
				state.currentRound.status === "POINTING")
		) {
			throw new ExplainerCannotBeMovedError(
				playerId,
				player.name,
				state.currentRound.id,
			);
		}

		const targetTeam = state.teams.find((t) => t.id === teamId);
		if (!targetTeam) {
			throw new TeamNotFoundError(teamId);
		}

		for (const team of state.teams) {
			if (team.playerIds) {
				team.playerIds = team.playerIds.filter((id) => id !== playerId);
			}
		}
		if (state.spectators) {
			state.spectators = state.spectators.filter((id) => id !== playerId);
		}

		player.teamId = targetTeam.id;
		if (Array.isArray(targetTeam.playerIds)) {
			if (!targetTeam.playerIds.includes(playerId)) {
				targetTeam.playerIds.push(playerId);
			}
		}
		return;
	}

	// 9. MOVE_TO_SPECTATORS
	if (action.type === "MOVE_TO_SPECTATORS") {
		const { playerId } = action.payload as { playerId: string };

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
			state.currentRound &&
			state.currentRound.explainerId === playerId &&
			(state.currentRound.status === "IN_PROGRESS" ||
				state.currentRound.status === "POINTING")
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

		// If current explainer moved to spectators, pause round
		const now = ctx.now ?? Date.now();
		const round = state.currentRound;
		if (round?.explainerId === playerId && round.status === "IN_PROGRESS") {
			round.pausedAt = now;
			round.remainingMs = Math.max(0, round.endTime - now);
		}

		// If active playing team became completely empty, finish round
		if (round?.status === "IN_PROGRESS") {
			const activeTeam = state.teams.find((t) => t.id === round.teamId);
			if (
				activeTeam &&
				(!activeTeam.playerIds || activeTeam.playerIds.length === 0)
			) {
				round.status = "FINISHED";
			}
		}
		return;
	}

	// 10. SHUFFLE_PLAYERS
	if (action.type === "SHUFFLE_PLAYERS") {
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
			team.playerIds!.push(player.id);
		});
		return;
	}

	// 11. TOGGLE_READY
	if (action.type === "TOGGLE_READY") {
		if (state.status !== "LOBBY") {
			throw new GameNotInLobbyError(
				"Cannot toggle ready: game not in lobby",
			);
		}

		const { playerId } = action.payload as { playerId: string };
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
		return;
	}

	// 12. KICK_PLAYER
	if (action.type === "KICK_PLAYER") {
		if (action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError(
				"Only room owner can kick players",
			);
		}

		const { targetPlayerId, isPermanent } = action.payload as {
			targetPlayerId: string;
			isPermanent?: boolean;
		};

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

		// If current explainer was kicked, pause round
		const now = ctx.now ?? Date.now();
		const round = state.currentRound;
		if (
			round?.explainerId === targetPlayerId &&
			round.status === "IN_PROGRESS"
		) {
			round.pausedAt = now;
			round.remainingMs = Math.max(0, round.endTime - now);
		}

		// If active playing team became completely empty, finish round
		if (round?.status === "IN_PROGRESS") {
			const activeTeam = state.teams.find((t) => t.id === round.teamId);
			if (
				activeTeam &&
				(!activeTeam.playerIds || activeTeam.playerIds.length === 0)
			) {
				round.status = "FINISHED";
			}
		}

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
};
