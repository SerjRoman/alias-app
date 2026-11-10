import { v4 as uuidv4 } from "uuid";
import type { ActionContext, GamePipelineHandler } from "../pipeline.types";
import { RoundStatus, type WordOutcome } from "../../state/game.state";
import { WordCycledDomainEvent } from "../../events/game.events";
import { calculateWordScore } from "../scoring-pipeline";
import { UserIsNotExplainerError } from "../../errors/round.errors";

/**
 * Standard word cycle pipeline handler.
 * Records the played word's final score, outcome, and snapshotted effect IDs,
 * archives it into the round's words history, advances currentWord to the next word,
 * and emits WordCycledDomainEvent.
 */
export const wordCycleHandler: GamePipelineHandler = (ctx: ActionContext) => {
	const { action, state, emit } = ctx;

	if (action.type !== "WORD_GUESSED" && action.type !== "WORD_SKIPPED") {
		return;
	}

	const round = state.currentRound;
	if (round?.status !== RoundStatus.IN_PROGRESS) {
		return;
	}

	// Verify actor is the designated explainer if both IDs are present
	const explainerId = round.explainerId;
	if (action.actorId && explainerId && action.actorId !== explainerId) {
		throw new UserIsNotExplainerError(
			action.actorId,
			"Only the round explainer can cycle words",
		);
	}

	const playedWord = round.currentWord;
	if (!playedWord) {
		return;
	}

	const outcome: WordOutcome =
		action.type === "WORD_GUESSED" ? "guessed" : "skipped";
	const snapshotEffectIds =
		ctx.resolvedEffectIds ??
		(state.activeEffects ?? [])
			.filter(
				(e) => e.status === "ACTIVE" && e.targetTeamId === round.teamId,
			)
			.map((e) => e.id);

	const wordScore =
		ctx.resolvedWordScore ??
		calculateWordScore(
			outcome,
			snapshotEffectIds,
			state.activeEffects ?? [],
		).score;

	playedWord.score = wordScore;
	playedWord.outcome = outcome;
	playedWord.appliedEffectIds = snapshotEffectIds;

	// Archive the played word to the round's history
	round.words.push(playedWord);

	// Retrieve next word from action payload
	const payload = action.payload as { nextWordText?: string } | undefined;
	const nextText = payload?.nextWordText;

	if (nextText) {
		round.currentWord = {
			id: uuidv4(),
			text: nextText,
			score: 0,
		};
	} else {
		round.currentWord = null;
	}

	// Emit domain event for the cycled word
	emit(new WordCycledDomainEvent(state.id, playedWord, round.currentWord));
};
