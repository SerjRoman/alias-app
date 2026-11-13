import { v4 as uuidv4 } from "uuid";
import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type { StartRoundAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import { RoundStatus } from "../../../state/game.state";
import { RoundStartedDomainEvent } from "../../../events/game.events";
import {
	NotRoundExplainerError,
	PlayerNotRoomOwnerError,
} from "../../../errors/game.errors";
import { RoundIsNotPending } from "../../../errors/round.errors";
import { assertAtLeastTwoTeamsHaveOnlinePlayers } from "./round.helpers";

export class StartRoundStrategy implements ActionStrategy<StartRoundAction> {
	readonly actionType = "START_ROUND" as const;

	handle(action: StartRoundAction, ctx: ActionContext): void {
		const { state, emit } = ctx;
		const round = state.currentRound;

		if (round?.status !== RoundStatus.PENDING) {
			throw new RoundIsNotPending(
				"Round can only be started when PENDING",
			);
		}

		const explainerId = round.explainerId;
		const payload = action.payload;

		if (payload.force) {
			if (action.actorId !== state.ownerId) {
				throw new PlayerNotRoomOwnerError();
			}
		} else if (
			action.actorId &&
			action.actorId !== explainerId &&
			action.actorId !== state.ownerId
		) {
			throw new NotRoundExplainerError(
				"Only the designated explainer or room owner can start the round",
			);
		}

		assertAtLeastTwoTeamsHaveOnlinePlayers(state, round.teamId);

		const explainer = state.players.find((p) => p.id === explainerId);
		if (!explainer || explainer.isOnline === false) {
			throw new NotRoundExplainerError(
				"Explainer is offline or not found",
			);
		}

		round.status = RoundStatus.IN_PROGRESS;
		const now = ctx.now ?? Date.now();
		const durationMs = (payload.durationSeconds || 60) * 1000;
		round.durationMs = durationMs;
		round.expiresAt = now + durationMs;
		round.pausedAt = null;
		round.remainingMs = null;

		for (const p of state.players) {
			if (p.isRoundReady !== undefined) {
				p.isRoundReady = false;
			}
		}

		if (payload.firstWordText) {
			round.currentWord = {
				id: uuidv4(),
				text: payload.firstWordText,
				score: 0,
			};
		}

		emit(
			new RoundStartedDomainEvent(
				state.id,
				round.id,
				round.teamId,
				explainerId,
				round.expiresAt,
			),
		);
	}
}
