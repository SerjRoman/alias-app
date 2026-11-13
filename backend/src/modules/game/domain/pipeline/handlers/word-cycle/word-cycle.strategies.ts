import { v4 as uuidv4 } from "uuid";
import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type {
	WordGuessedAction,
	WordSkippedAction,
} from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import { RoundStatus, type WordOutcome } from "../../../state/game.state";
import { WordCycledDomainEvent } from "../../../events/game.events";
import { calculateWordScore } from "../../scoring-pipeline";
import { NoActiveTeamError } from "../../../errors/team.errors";
import {
	NoActiveWordError,
	RoundIsNotInProgress,
	UserIsNotExplainerError,
} from "../../../errors/round.errors";

/**
 * Strategy responsible for validating all invariants and preconditions
 * for word cycling actions (WORD_GUESSED, WORD_SKIPPED) before any scoring
 * mutations or word cycle advances take place.
 */
export class WordCyclingGuardStrategy implements ActionStrategy<
	WordGuessedAction | WordSkippedAction
> {
	readonly actionType = ["WORD_GUESSED", "WORD_SKIPPED"] as const;

	handle(
		action: WordGuessedAction | WordSkippedAction,
		ctx: ActionContext,
	): void {
		if (action.type !== "WORD_GUESSED" && action.type !== "WORD_SKIPPED") {
			return;
		}

		const { state } = ctx;

		const hasActiveTeam = state.teams.some(
			(t) => t.id === state.activeTeamId,
		);
		if (!hasActiveTeam) {
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

		if (!round.currentWord) {
			throw new NoActiveWordError();
		}
	}
}

/**
 * Strategy responsible for archiving the played word with its final score,
 * outcome and effect snapshots into the round history, advancing to the next word,
 * and emitting WordCycledDomainEvent.
 */
export class WordCycleStrategy implements ActionStrategy<
	WordGuessedAction | WordSkippedAction
> {
	readonly actionType = ["WORD_GUESSED", "WORD_SKIPPED"] as const;

	handle(
		action: WordGuessedAction | WordSkippedAction,
		ctx: ActionContext,
	): void {
		const { state, emit } = ctx;

		if (action.type !== "WORD_GUESSED" && action.type !== "WORD_SKIPPED") {
			return;
		}

		const round = state.currentRound;
		if (round?.status !== RoundStatus.IN_PROGRESS) {
			return;
		}

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
					(e) =>
						e.status === "ACTIVE" &&
						e.targetTeamId === round.teamId,
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

		round.words.push(playedWord);

		const payload = action.payload;
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

		emit(
			new WordCycledDomainEvent(state.id, playedWord, round.currentWord),
		);
	}
}
