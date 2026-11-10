import type { ActionContext, GamePipelineHandler } from "../pipeline.types";
import { RoundStatus, type WordOutcome } from "../../state/game.state";
import {
	WordGuessedDomainEvent,
	WordSkippedDomainEvent,
} from "../../events/game.events";
import { calculateWordScore } from "../scoring-pipeline";
import { NoActiveTeamError } from "../../errors/team.errors";
import {
	NoActiveWordError,
	RoundIsNotInProgress,
	UserIsNotExplainerError,
} from "../../errors/round.errors";

/**
 * Standard Alias word scoring pipeline handler.
 * Evaluates points for guessed and skipped words using the staged scoring pipeline,
 * consumes charge-based effects when triggered, updates active team score, and emits domain events.
 */
export const scoringHandler: GamePipelineHandler = (ctx: ActionContext) => {
	const { action, state } = ctx;

	if (action.type !== "WORD_GUESSED" && action.type !== "WORD_SKIPPED") {
		return;
	}

	const activeTeam = state.teams.find((t) => t.id === state.activeTeamId);
	if (!activeTeam) {
		throw new NoActiveTeamError();
	}

	const round = state.currentRound;
	if (round?.status !== RoundStatus.IN_PROGRESS) {
		throw new RoundIsNotInProgress();
	}

	const explainerId = round.explainerId;
	if (action.actorId && explainerId && action.actorId !== explainerId) {
		throw new UserIsNotExplainerError(
			action.actorId,
			"Only the round explainer can cycle words",
		);
	}

	const currentWord = round.currentWord;
	if (!currentWord) {
		throw new NoActiveWordError();
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

	for (const effectId of consumedEffectIds) {
		const eff = state.activeEffects?.find((e) => e.id === effectId);
		if (eff) {
			eff.charges = (eff.charges ?? 1) - 1;
			if (eff.charges <= 0) {
				eff.status = "CONSUMED";
			}
		}
	}

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
};
