import { v4 as uuidv4 } from "uuid";
import type { ActionContext, GamePipelineHandler } from "../pipeline.types";
import {
	RoundStatus,
	type RoundState,
	type TeamState,
	type WordOutcome,
} from "../../state/game.state";
import {
	RoundCreatedDomainEvent,
	RoundEndedDomainEvent,
	RoundPointingStartedDomainEvent,
	RoundStartedDomainEvent,
	WordScoreChangedDomainEvent,
} from "../../events/game.events";
import { calculateWordScore, EFFECT_REGISTRY } from "../scoring-pipeline";
import {
	GameNotInProgressError,
	NotRoundExplainerError,
	PlayerNotFoundError,
	PlayerNotRoomOwnerError,
} from "../../errors/game.errors";
import {
	TeamHasNoOnlinePlayersError,
	TeamNotFoundError,
} from "../../errors/team.errors";
import {
	RoundIsNotFinished,
	RoundIsNotInProgress,
	RoundIsNotPending,
	RoundIsNotPointing,
	RoundNotActiveError,
	WordInRoundNotFound,
} from "../../errors/round.errors";

function assertAtLeastTwoTeamsHaveOnlinePlayers(
	state: ActionContext["state"],
	targetTeamId?: string,
) {
	const teamsWithOnlinePlayers = state.teams.filter((team) => {
		const onlinePlayers = state.players.filter(
			(p) =>
				(p.teamId === team.id ||
					Boolean(team.playerIds?.includes(p.id))) &&
				p.isOnline !== false,
		);
		return onlinePlayers.length > 0;
	});

	if (teamsWithOnlinePlayers.length < 2) {
		const emptyTeam = state.teams.find(
			(t) => !teamsWithOnlinePlayers.some((active) => active.id === t.id),
		);
		throw new TeamHasNoOnlinePlayersError(
			emptyTeam ? emptyTeam.id : "",
			emptyTeam?.name,
		);
	}

	if (
		targetTeamId &&
		!teamsWithOnlinePlayers.some((t) => t.id === targetTeamId)
	) {
		const targetTeam = state.teams.find((t) => t.id === targetTeamId);
		throw new TeamHasNoOnlinePlayersError(targetTeamId, targetTeam?.name);
	}

	return teamsWithOnlinePlayers;
}

const OUTCOME_LADDER: readonly WordOutcome[] = Object.freeze([
	"skipped",
	"neutral",
	"guessed",
]);

function inferOutcomeFromWord(word: {
	outcome?: WordOutcome;
	score: number;
}): WordOutcome {
	if (word.outcome) {
		return word.outcome;
	}
	if (word.score > 0) return "guessed";
	if (word.score < 0) return "skipped";
	return "neutral";
}

/**
 * Standard round lifecycle and flow pipeline handler.
 * Manages round state transitions: TOGGLE_ROUND_READY, SET_EXPLAINER,
 * START_ROUND, CHANGE_ROUND_TIME, START_POINTING, CHANGE_WORD_SCORE,
 * END_POINTING, FINISH_ROUND, and NEXT_ROUND.
 */
export const roundFlowHandler: GamePipelineHandler = (ctx: ActionContext) => {
	const { action, state, emit } = ctx;

	// 0. TOGGLE_ROUND_READY
	if (action.type === "TOGGLE_ROUND_READY") {
		const payload = action.payload as { playerId?: string } | undefined;
		const playerId = payload?.playerId ?? action.actorId ?? "";
		const player = state.players.find((p) => p.id === playerId);
		if (!player) {
			throw new PlayerNotFoundError(playerId);
		}
		player.isRoundReady = !player.isRoundReady;
		return;
	}

	if (
		action.type !== "START_ROUND" &&
		action.type !== "START_POINTING" &&
		action.type !== "CHANGE_WORD_SCORE" &&
		action.type !== "END_POINTING" &&
		action.type !== "NEXT_ROUND" &&
		action.type !== "SET_EXPLAINER" &&
		action.type !== "CHANGE_ROUND_TIME" &&
		action.type !== "FINISH_ROUND"
	) {
		return;
	}

	const round = state.currentRound;

	// 1. SET_EXPLAINER
	if (action.type === "SET_EXPLAINER") {
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

		const payload = action.payload as {
			explainerId?: string;
			playerId?: string;
		};
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
			round.endTime = now + remaining;
			round.pausedAt = null;
			round.remainingMs = null;
		}

		return;
	}

	// 2. CHANGE_ROUND_TIME
	if (action.type === "CHANGE_ROUND_TIME") {
		if (state.status !== "IN_PROGRESS") {
			throw new GameNotInProgressError();
		}
		if (
			action.actorId &&
			action.actorId !== "system" &&
			action.actorId !== state.ownerId
		) {
			throw new PlayerNotRoomOwnerError();
		}
		if (!round) {
			throw new RoundNotActiveError();
		}
		if (round.status !== RoundStatus.IN_PROGRESS) {
			throw new RoundIsNotInProgress();
		}

		const { endTime } = action.payload as { endTime: number };
		round.endTime = endTime;
		return;
	}

	// 3. FINISH_ROUND (admin force-finish)
	if (action.type === "FINISH_ROUND") {
		if (state.status !== "IN_PROGRESS") {
			throw new GameNotInProgressError();
		}
		if (!round) {
			throw new RoundNotActiveError();
		}
		if (action.actorId !== state.ownerId) {
			throw new PlayerNotRoomOwnerError();
		}

		round.status = RoundStatus.FINISHED;
		const team = state.teams.find((t) => t.id === round.teamId);
		emit(
			new RoundEndedDomainEvent(
				state.id,
				round.id,
				round.teamId,
				team ? team.score : 0,
				false,
			),
		);
		return;
	}

	// 4. START_ROUND: Transition from PENDING to IN_PROGRESS
	if (action.type === "START_ROUND") {
		if (round?.status !== RoundStatus.PENDING) {
			throw new RoundIsNotPending(
				"Round can only be started when PENDING",
			);
		}

		const explainerId = round.explainerId;

		const payload = action.payload as {
			durationSeconds: number;
			firstWordText?: string;
			force?: boolean;
		};

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
		round.endTime = Date.now() + (payload.durationSeconds || 60) * 1000;

		for (const p of state.players) {
			if (p.isRoundReady !== undefined) {
				p.isRoundReady = false;
			}
		}

		// Activate all ARMED effects targeting this round's team
		if (state.activeEffects) {
			for (const effect of state.activeEffects) {
				if (
					effect.status === "ARMED" &&
					effect.targetTeamId === round.teamId
				) {
					effect.status = "ACTIVE";
				}
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
				round.endTime,
			),
		);
		return;
	}

	// 5. START_POINTING: Transition from IN_PROGRESS to POINTING
	if (action.type === "START_POINTING") {
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

		// Archive the last active word on the screen with score 0
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
		return;
	}

	// 6. CHANGE_WORD_SCORE: Edit a word score during the POINTING review phase
	if (action.type === "CHANGE_WORD_SCORE") {
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

		const payload = action.payload as {
			wordId: string;
			delta: number;
			outcome?: WordOutcome;
		};
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
		return;
	}

	// 7. END_POINTING: Finalize the round scores and evaluate win condition
	if (action.type === "END_POINTING") {
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

		// Consume all round-scoped ACTIVE effects targeting this round's team
		if (state.activeEffects) {
			for (const effect of state.activeEffects) {
				const rule = EFFECT_REGISTRY[effect.itemId];
				if (
					effect.status === "ACTIVE" &&
					effect.targetTeamId === round.teamId &&
					rule?.durationType === "round"
				) {
					effect.status = "CONSUMED";
				}
			}
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
		return;
	}

	// 8. NEXT_ROUND: Advance active team and initialize the next round
	if (action.type === "NEXT_ROUND") {
		if (round?.status !== RoundStatus.FINISHED) {
			throw new RoundIsNotFinished(
				"Previous round must be FINISHED before starting a new round",
			);
		}
		if (
			(state.settings?.isOnlyOwnerCanNextRound ?? true) &&
			action.actorId &&
			action.actorId !== state.ownerId
		) {
			throw new PlayerNotRoomOwnerError();
		}

		const teamsWithOnlinePlayers =
			assertAtLeastTwoTeamsHaveOnlinePlayers(state);

		const payload = action.payload as
			| {
					nextTeamId?: string;
					nextExplainerId?: string;
			  }
			| undefined;

		// Advance team cyclically to the next team with online players
		let nextTeam: TeamState | undefined;
		let nextTeamIndex = -1;

		if (payload?.nextTeamId) {
			const requestedTeam = state.teams.find(
				(t) => t.id === payload.nextTeamId,
			);
			if (
				requestedTeam &&
				teamsWithOnlinePlayers.some((t) => t.id === requestedTeam.id)
			) {
				nextTeam = requestedTeam;
				nextTeamIndex = state.teams.findIndex(
					(t) => t.id === requestedTeam.id,
				);
			}
		}

		if (!nextTeam) {
			const currentTeamIndex = state.teams.findIndex(
				(t) => t.id === (state.activeTeamId ?? round.teamId),
			);
			const totalTeams = state.teams.length;
			for (let i = 1; i <= totalTeams; i++) {
				const candidateIndex =
					currentTeamIndex >= 0
						? (currentTeamIndex + i) % totalTeams
						: (i - 1) % totalTeams;
				const candidateTeam = state.teams[candidateIndex];
				if (
					teamsWithOnlinePlayers.some(
						(active) => active.id === candidateTeam.id,
					)
				) {
					nextTeam = candidateTeam;
					nextTeamIndex = candidateIndex;
					break;
				}
			}
		}

		if (!nextTeam) {
			nextTeam = teamsWithOnlinePlayers[0];
			nextTeamIndex = state.teams.findIndex((t) => t.id === nextTeam!.id);
		}

		state.activeTeamId = nextTeam.id;
		state.lastTeamPlayedIndex = nextTeamIndex;

		// Select next explainer
		let nextExplainerId = payload?.nextExplainerId;

		const teamPlayers = state.players.filter(
			(p) =>
				p.teamId === nextTeam.id ||
				Boolean(nextTeam.playerIds?.includes(p.id)),
		);

		if (!nextExplainerId) {
			const prevIndex = nextTeam.lastExplainerId
				? teamPlayers.findIndex(
						(p) => p.id === nextTeam.lastExplainerId,
					)
				: -1;
			const startIdx =
				prevIndex >= 0 ? (prevIndex + 1) % teamPlayers.length : 0;

			let chosenId = "";
			for (let i = 0; i < teamPlayers.length; i++) {
				const candidate =
					teamPlayers[(startIdx + i) % teamPlayers.length];
				if (candidate.isOnline !== false) {
					chosenId = candidate.id;
					break;
				}
			}
			nextExplainerId = chosenId;
			nextTeam.lastExplainerId = nextExplainerId || null;
		} else {
			nextTeam.lastExplainerId = nextExplainerId;
		}

		const newRound: RoundState = {
			id: uuidv4(),
			explainerId: nextExplainerId,
			teamId: nextTeam.id,
			status: RoundStatus.PENDING,
			currentWord: null,
			words: [],
			roundNumber: round.roundNumber + 1,
			endTime: 0,
		};

		state.currentRound = newRound;

		emit(new RoundCreatedDomainEvent(state.id, newRound));
	}
};
