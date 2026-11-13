import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type {
	StartRoundAction,
	WordGuessedAction,
	WordSkippedAction,
	EndPointingAction,
} from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import { calculateWordScore, EFFECT_REGISTRY } from "../../scoring-pipeline";
import type { WordOutcome } from "../../../state/game.state";

/**
 * Strategy executed on START_ROUND to activate all ARMED effects
 * targeting the playing team or active explainer.
 */
export class ActivateArmedEffectsStrategy implements ActionStrategy<StartRoundAction> {
	readonly actionType = "START_ROUND" as const;

	handle(action: StartRoundAction, ctx: ActionContext): void {
		const { state } = ctx;
		const round = state.currentRound;
		if (!round || !state.activeEffects) {
			return;
		}

		for (const effect of state.activeEffects) {
			const isTargetMatch =
				(effect.targetTeamId && effect.targetTeamId === round.teamId) ||
				(effect.targetPlayerId &&
					effect.targetPlayerId === round.explainerId);

			if (effect.status === "ARMED" && isTargetMatch) {
				effect.status = "ACTIVE";
			}
		}
	}
}

/**
 * Strategy executed on WORD_GUESSED / WORD_SKIPPED to decrement charges
 * of charge-based effects (e.g. FREE_SKIP_SHIELD) and transition them to CONSUMED when depleted.
 */
export class ConsumeEffectChargeStrategy implements ActionStrategy<
	WordGuessedAction | WordSkippedAction
> {
	readonly actionType = ["WORD_GUESSED", "WORD_SKIPPED"] as const;

	handle(
		action: WordGuessedAction | WordSkippedAction,
		ctx: ActionContext,
	): void {
		const { state } = ctx;
		if (!state.activeEffects || state.activeEffects.length === 0) {
			return;
		}

		let consumedIds = ctx.consumedEffectIds;

		if (!consumedIds) {
			const outcome: WordOutcome =
				action.type === "WORD_GUESSED" ? "guessed" : "skipped";
			const teamId =
				state.currentRound?.teamId ?? state.activeTeamId ?? "";
			const snapshotEffectIds =
				ctx.resolvedEffectIds ??
				state.activeEffects
					.filter(
						(e) =>
							e.status === "ACTIVE" && e.targetTeamId === teamId,
					)
					.map((e) => e.id);

			const result = calculateWordScore(
				outcome,
				snapshotEffectIds,
				state.activeEffects,
			);
			consumedIds = result.consumedEffectIds;
			ctx.consumedEffectIds = consumedIds;
		}

		if (consumedIds.length === 0) {
			return;
		}

		for (const effectId of consumedIds) {
			const eff = state.activeEffects.find((e) => e.id === effectId);
			if (eff) {
				eff.charges = (eff.charges ?? 1) - 1;
				if (eff.charges <= 0) {
					eff.status = "CONSUMED";
				}
			}
		}

		state.activeEffects = state.activeEffects.filter(
			(e) => e.status !== "CONSUMED",
		);
	}
}

/**
 * Strategy executed on END_POINTING to consume all ACTIVE round-scoped effects
 * targeting the finished round's team.
 */
export class ConsumeRoundEffectsStrategy implements ActionStrategy<EndPointingAction> {
	readonly actionType = "END_POINTING" as const;

	handle(action: EndPointingAction, ctx: ActionContext): void {
		const { state } = ctx;
		const round = state.currentRound;
		if (!round || !state.activeEffects) {
			return;
		}

		state.activeEffects = state.activeEffects.filter((effect) => {
			const rule = EFFECT_REGISTRY[effect.itemId];
			return !(
				effect.status === "ACTIVE" &&
				effect.targetTeamId === round.teamId &&
				rule?.durationType === "round"
			);
		});
	}
}
