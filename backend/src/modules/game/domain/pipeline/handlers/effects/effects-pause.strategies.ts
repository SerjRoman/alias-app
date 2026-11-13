import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type {
	PauseGameAction,
	ResumeGameAction,
} from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import { pauseTimer, resumeTimer } from "../../../time";
import {
	GamePausedDomainEvent,
	GameResumedDomainEvent,
} from "../../../events/game.events";

export class PauseEffectsStrategy implements ActionStrategy<PauseGameAction> {
	readonly actionType = "PAUSE_GAME" as const;

	handle(_action: PauseGameAction, ctx: ActionContext): void {
		const { state, now, emit } = ctx;
		const timestamp = now ?? Date.now();

		if (state.activeEffects && state.activeEffects.length > 0) {
			for (const eff of state.activeEffects) {
				const deadline = eff.expiresAt;
				if (eff.status === "ACTIVE" && deadline && !eff.pausedAt) {
					pauseTimer(eff, timestamp);
				}
			}
		}

		const roundRemainingMs = state.currentRound?.remainingMs ?? null;
		const effectsRemaining = (state.activeEffects ?? [])
			.filter(
				(e) =>
					e.status === "ACTIVE" &&
					e.remainingMs !== null &&
					e.remainingMs !== undefined,
			)
			.map((e) => ({
				effectId: e.id,
				remainingMs: e.remainingMs as number,
			}));

		emit(
			new GamePausedDomainEvent(
				state.id,
				timestamp,
				roundRemainingMs,
				effectsRemaining,
			),
		);
	}
}

export class ResumeEffectsStrategy implements ActionStrategy<ResumeGameAction> {
	readonly actionType = "RESUME_GAME" as const;

	handle(_action: ResumeGameAction, ctx: ActionContext): void {
		const { state, now, emit } = ctx;
		const timestamp = now ?? Date.now();

		if (state.activeEffects && state.activeEffects.length > 0) {
			for (const eff of state.activeEffects) {
				if (eff.status === "ACTIVE" && eff.pausedAt) {
					resumeTimer(eff, timestamp);
				}
			}
		}

		const roundExpiresAt = state.currentRound?.expiresAt ?? null;
		const effectsDeadlines = (state.activeEffects ?? [])
			.filter((e) => e.status === "ACTIVE" && e.expiresAt !== undefined)
			.map((e) => ({
				effectId: e.id,
				expiresAt: e.expiresAt as number,
			}));

		emit(
			new GameResumedDomainEvent(
				state.id,
				timestamp,
				roundExpiresAt,
				effectsDeadlines,
			),
		);
	}
}
