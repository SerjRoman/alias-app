import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type {
	StartPointingAction,
	ChangeWordScoreAction,
	EndPointingAction,
} from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import { RoundStatus, type WordOutcome } from "../../../state/game.state";
import {
	RoundPointingStartedDomainEvent,
	WordScoreChangedDomainEvent,
	RoundEndedDomainEvent,
} from "../../../events/game.events";
import { calculateWordScore } from "../../scoring-pipeline";
import {
	GameNotInProgressError,
	PlayerNotRoomOwnerError,
} from "../../../errors/game.errors";
import {
	RoundIsNotInProgress,
	RoundIsNotPointing,
	RoundNotActiveError,
	WordInRoundNotFound,
} from "../../../errors/round.errors";
import { inferOutcomeFromWord, OUTCOME_LADDER } from "./round.helpers";

export class StartPointingStrategy implements ActionStrategy<StartPointingAction> {
	readonly actionType = "START_POINTING" as const;

	handle(action: StartPointingAction, ctx: ActionContext): void {
		const { state, emit } = ctx;
		const round = state.currentRound;

		if (
			action.actorId &&
			action.actorId !== "system" &&
			action.actorId !== state.ownerId
		) {
			throw new PlayerNotRoomOwnerError();
		}
		if (round?.status !== RoundStatus.IN_PROGRESS) {
			throw new RoundIsNotInProgress(
				"Cannot enter pointing: round is not IN_PROGRESS",
			);
		}

		if (round.currentWord) {
			round.currentWord.score = 0;
			round.currentWord.outcome = "neutral";
			round.currentWord.appliedEffectIds = (state.activeEffects ?? [])
				.filter(
					(e) =>
						e.status === "ACTIVE" &&
						e.targetTeamId === round.teamId,
				)
				.map((e) => e.id);
			round.words.push(round.currentWord);
			round.currentWord = null;
		}

		round.status = RoundStatus.POINTING;
		emit(
			new RoundPointingStartedDomainEvent(
				state.id,
				round.id,
				round.words,
			),
		);
	}
}

export class ChangeWordScoreStrategy implements ActionStrategy<ChangeWordScoreAction> {
	readonly actionType = "CHANGE_WORD_SCORE" as const;

	handle(action: ChangeWordScoreAction, ctx: ActionContext): void {
		const { state, emit } = ctx;
		const round = state.currentRound;

		if (
			state.settings?.isOnlyOwnerCanChangeScore &&
			action.actorId !== state.ownerId
		) {
			throw new PlayerNotRoomOwnerError();
		}
		if (round?.status !== RoundStatus.POINTING) {
			throw new RoundIsNotPointing(
				"Word score can only be changed during POINTING phase",
			);
		}

		const payload = action.payload;
		const word = round.words.find((w) => w.id === payload.wordId);
		if (!word) {
			throw new WordInRoundNotFound(
				payload.wordId,
				`Word ${payload.wordId} not found in current round`,
			);
		}

		const oldScore = word.score;
		const currentOutcome = inferOutcomeFromWord(word);
		const currentIndex = OUTCOME_LADDER.indexOf(currentOutcome);
		const step =
			Math.abs(payload.delta) >= 2
				? Math.sign(payload.delta) * 2
				: Math.sign(payload.delta);
		const nextIndex = Math.max(0, Math.min(2, currentIndex + step));
		const newOutcome: WordOutcome =
			payload.outcome ?? OUTCOME_LADDER[nextIndex];

		const { score: newScore } = calculateWordScore(
			newOutcome,
			word.appliedEffectIds ?? [],
			state.activeEffects ?? [],
		);
		const diff = newScore - oldScore;

		word.score = newScore;
		word.outcome = newOutcome;

		const team = state.teams.find((t) => t.id === round.teamId);
		if (team) {
			team.score = Math.max(0, team.score + diff);
		}

		emit(
			new WordScoreChangedDomainEvent(
				state.id,
				round.id,
				word.id,
				newScore,
				team ? team.score : 0,
			),
		);
	}
}

export class EndPointingStrategy implements ActionStrategy<EndPointingAction> {
	readonly actionType = "END_POINTING" as const;

	handle(action: EndPointingAction, ctx: ActionContext): void {
		const { state, emit } = ctx;
		const round = state.currentRound;

		if (
			action.actorId &&
			action.actorId !== "system" &&
			action.actorId !== state.ownerId
		) {
			throw new PlayerNotRoomOwnerError();
		}
		if (round?.status !== RoundStatus.POINTING) {
			throw new RoundIsNotPointing(
				"Cannot end pointing: round is not in POINTING status",
			);
		}

		round.status = RoundStatus.FINISHED;

		const roundWordsScore = round.words.reduce(
			(acc, w) => acc + w.score,
			0,
		);
		const explainer = state.players.find((p) => p.id === round.explainerId);
		if (
			explainer &&
			(roundWordsScore !== 0 || explainer.score !== undefined)
		) {
			explainer.score = (explainer.score ?? 0) + roundWordsScore;
		}

		const team = state.teams.find((t) => t.id === round.teamId);
		const totalTeamScore = team ? team.score : 0;

		const pointsToWin =
			state.pointsToWin ?? state.settings?.pointsToWin ?? 30;
		const isGameFinished = totalTeamScore >= pointsToWin;
		if (isGameFinished) {
			state.status = "FINISHED";
			state.winnerTeamId = team?.id ?? null;
		}

		emit(
			new RoundEndedDomainEvent(
				state.id,
				round.id,
				round.teamId,
				totalTeamScore,
				isGameFinished,
			),
		);
	}
}
