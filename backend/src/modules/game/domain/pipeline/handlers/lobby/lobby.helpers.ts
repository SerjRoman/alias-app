import {
	RoundStatus,
	type GameState,
	type RoundState,
} from "../../../state/game.state";
import { pauseTimer, resumeTimer } from "../../../time";

/**
 * Handles round pausing if the departing player was the active explainer,
 * and marks the round as FINISHED if the playing team has become completely empty.
 */
export function handlePlayerDepartureSideEffects(
	state: GameState,
	playerId: string,
	now: number,
): void {
	const round = state.currentRound;
	if (
		round?.explainerId === playerId &&
		round.status === RoundStatus.IN_PROGRESS
	) {
		pauseTimer(round, now);
	}

	if (round?.status === RoundStatus.IN_PROGRESS) {
		const activeTeam = state.teams.find((t) => t.id === round.teamId);
		if (
			activeTeam &&
			(!activeTeam.playerIds || activeTeam.playerIds.length === 0)
		) {
			round.status = RoundStatus.FINISHED;
		}
	}
}

/**
 * Resumes a paused round if the specified player is the explainer.
 */
export function resumeRoundIfExplainer(
	round: RoundState | null,
	playerId: string,
	now: number,
): void {
	if (
		round?.explainerId === playerId &&
		round.pausedAt !== null &&
		round.pausedAt !== undefined
	) {
		resumeTimer(round, now);
	}
}

/**
 * Automatically transfers room ownership to the next eligible online player
 * when the current owner leaves the game.
 */
export function transferOwnershipOnLeave(
	state: GameState,
	leavingPlayerId: string,
): void {
	if (state.ownerId !== leavingPlayerId) {
		return;
	}

	const onlineTeamPlayer = state.players.find(
		(p) => p.isOnline !== false && p.teamId,
	);
	const onlineSpectator = state.players.find((p) => p.isOnline !== false);
	const newOwner = onlineTeamPlayer ?? onlineSpectator;

	if (newOwner) {
		state.ownerId = newOwner.id;
		state.ownerOfflineSince = null;
	}
}
