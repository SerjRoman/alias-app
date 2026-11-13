import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type {
	WordGuessedAction,
	WordSkippedAction,
} from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import type { WordOutcome } from "../../../state/game.state";
import {
	WordGuessedDomainEvent,
	WordSkippedDomainEvent,
} from "../../../events/game.events";
import { calculateWordScore } from "../../scoring-pipeline";

/**
 * Strategy responsible exclusively for evaluating word scores,
 * setting score deltas on ActionContext, updating active team score,
 * and emitting scoring domain events.
 * Preconditions are verified by WordCyclingGuardStrategy.
 * Does not mutate activeEffects.
 */
export class WordScoringStrategy implements ActionStrategy<
	WordGuessedAction | WordSkippedAction
> {
	readonly actionType = ["WORD_GUESSED", "WORD_SKIPPED"] as const;

	handle(
		action: WordGuessedAction | WordSkippedAction,
		ctx: ActionContext,
	): void {
		const { state } = ctx;

		if (action.type !== "WORD_GUESSED" && action.type !== "WORD_SKIPPED") {
			return;
		}

		const activeTeam = state.teams.find((t) => t.id === state.activeTeamId);
		const round = state.currentRound;
		const currentWord = round?.currentWord;
		if (!activeTeam || !round || !currentWord) {
			return;
		}

		const outcome: WordOutcome =
			action.type === "WORD_GUESSED" ? "guessed" : "skipped";
		const teamId = state.currentRound?.teamId ?? activeTeam.id;
		const snapshotEffectIds = (state.activeEffects ?? [])
			.filter((e) => e.status === "ACTIVE" && e.targetTeamId === teamId)
			.map((e) => e.id);

		const { score: finalDelta, consumedEffectIds } = calculateWordScore(
			outcome,
			snapshotEffectIds,
			state.activeEffects ?? [],
		);

		ctx.resolvedWordScore = finalDelta;
		ctx.resolvedEffectIds = snapshotEffectIds;
		ctx.consumedEffectIds = consumedEffectIds;

		const newScore = Math.max(0, activeTeam.score + finalDelta);
		activeTeam.score = newScore;

		if (action.type === "WORD_GUESSED") {
			ctx.emit(
				new WordGuessedDomainEvent(
					state.id,
					currentWord.text,
					finalDelta,
					newScore,
				),
			);
			return;
		}

		ctx.emit(
			new WordSkippedDomainEvent(state.id, currentWord.text, finalDelta),
		);
	}
}
