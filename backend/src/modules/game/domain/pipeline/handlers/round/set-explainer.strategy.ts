import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type { SetExplainerAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import { RoundStatus } from "../../../state/game.state";
import {
	GameNotInProgressError,
	PlayerNotFoundError,
	PlayerNotRoomOwnerError,
} from "../../../errors/game.errors";
import {
	RoundIsNotPending,
	RoundNotActiveError,
} from "../../../errors/round.errors";
import { TeamNotFoundError } from "../../../errors/team.errors";

export class SetExplainerStrategy implements ActionStrategy<SetExplainerAction> {
	readonly actionType = "SET_EXPLAINER" as const;

	handle(action: SetExplainerAction, ctx: ActionContext): void {
		const { state } = ctx;
		const round = state.currentRound;

		if (state.status !== "IN_PROGRESS") {
			throw new GameNotInProgressError();
		}
		if (action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError();
		}
		if (!round) {
			throw new RoundNotActiveError();
		}

		const isPausedInProgress =
			round.status === RoundStatus.IN_PROGRESS &&
			round.pausedAt !== null &&
			round.pausedAt !== undefined;

		if (round.status !== RoundStatus.PENDING && !isPausedInProgress) {
			throw new RoundIsNotPending();
		}

		const payload = action.payload;
		const targetExplainerId = payload.explainerId ?? payload.playerId ?? "";

		const team = state.teams.find((t) => t.id === round.teamId);
		if (!team) {
			throw new TeamNotFoundError(round.teamId);
		}

		const teamPlayers = state.players.filter(
			(p) =>
				p.teamId === team.id || Boolean(team.playerIds?.includes(p.id)),
		);
		const playerIdx = teamPlayers.findIndex(
			(p) => p.id === targetExplainerId,
		);
		if (playerIdx === -1) {
			throw new PlayerNotFoundError(targetExplainerId);
		}

		round.explainerId = targetExplainerId;
		team.lastExplainerId = targetExplainerId;

		if (isPausedInProgress) {
			const now = ctx.now ?? Date.now();
			const remaining = round.remainingMs ?? 0;
			round.expiresAt = now + remaining;
			round.pausedAt = null;
			round.remainingMs = null;
		}
	}
}
