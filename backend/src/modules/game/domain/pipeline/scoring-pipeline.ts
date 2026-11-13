import type { GameAction } from "../actions/game.actions";
import { ActionBlockedByEffectError } from "../errors/game.errors";
import {
	EffectExpiredDomainEvent,
	DomainEvent,
} from "../events/game.events";
import type {
	ActiveEffect,
	EffectDurationType,
	EffectItemId,
	WordOutcome,
} from "../state/game.state";

export type { ActiveEffect, EffectDurationType, EffectItemId, WordOutcome };

export type ScoreStage = "additive" | "multiplicative" | "override";

export interface EffectRule {
	itemId: EffectItemId;
	durationType: EffectDurationType;
	guardCommand?(action: GameAction, effect: ActiveEffect, now: number): void;
	scoreModifier?: {
		stage: ScoreStage;
		appliesTo: WordOutcome;
		apply(currentScore: number): number;
		consumeChargeOnApply?: boolean;
	};
}

export const STAGE_ORDER: readonly ScoreStage[] = Object.freeze([
	"additive",
	"multiplicative",
	"override",
]);

export const EFFECT_REGISTRY: Record<string, EffectRule> = {
	DOUBLE_POINTS: {
		itemId: "DOUBLE_POINTS",
		durationType: "round",
		scoreModifier: {
			stage: "multiplicative",
			appliesTo: "guessed",
			apply: (score: number) => score * 2,
		},
	},
	ENEMY_SKIP_PENALTY: {
		itemId: "ENEMY_SKIP_PENALTY",
		durationType: "round",
		scoreModifier: {
			stage: "additive",
			appliesTo: "skipped",
			apply: (score: number) => score - 1,
		},
	},
	FREE_SKIP_SHIELD: {
		itemId: "FREE_SKIP_SHIELD",
		durationType: "charges",
		scoreModifier: {
			stage: "override",
			appliesTo: "skipped",
			apply: () => 0,
			consumeChargeOnApply: true,
		},
	},
	FREEZE_NEXT_WORD: {
		itemId: "FREEZE_NEXT_WORD",
		durationType: "seconds",
		guardCommand(action: GameAction, effect: ActiveEffect, now: number) {
			const isWordAction =
				action.type === "WORD_GUESSED" ||
				action.type === "WORD_SKIPPED";
			if (
				isWordAction &&
				action.actorId &&
				action.actorId === effect.targetPlayerId &&
				effect.expiresAt !== undefined &&
				now < effect.expiresAt
			) {
				throw new ActionBlockedByEffectError(
					"Action denied: Explainer is frozen from cycling words",
				);
			}
		},
	},
	VOICE_MUTE: {
		itemId: "VOICE_MUTE",
		durationType: "seconds",
	},
	CLEANSE: {
		itemId: "CLEANSE",
		durationType: "instant",
	},
	EXTRA_TIME: {
		itemId: "EXTRA_TIME",
		durationType: "instant",
	},
	TIME_DRAIN: {
		itemId: "TIME_DRAIN",
		durationType: "instant",
	},
	FLIP_WORD: {
		itemId: "FLIP_WORD",
		durationType: "seconds",
	},
	REROLL_WORD: {
		itemId: "REROLL_WORD",
		durationType: "instant",
	},
};

/**
 * Pure staged scoring pipeline for a single word.
 * Evaluates base score for the outcome, then applies snapshotted effects
 * in strict stage order: additive -> multiplicative -> override.
 */
export function calculateWordScore(
	outcome: WordOutcome,
	appliedEffectIds: string[],
	allEffects: ActiveEffect[],
): { score: number; consumedEffectIds: string[] } {
	if (outcome === "neutral") {
		return { score: 0, consumedEffectIds: [] };
	}

	// Stage 0: Base score
	let score = outcome === "guessed" ? 1 : -1;

	const wordEffects = allEffects.filter((e) =>
		appliedEffectIds.includes(e.id),
	);
	const consumedEffectIds: string[] = [];

	// Stages 1..3: additive -> multiplicative -> override
	for (const stage of STAGE_ORDER) {
		for (const effect of wordEffects) {
			const rule = EFFECT_REGISTRY[effect.itemId];
			const mod = rule?.scoreModifier;
			if (mod?.stage !== stage || mod.appliesTo !== outcome) {
				continue;
			}
			score = mod.apply(score);
			if (mod.consumeChargeOnApply) {
				consumedEffectIds.push(effect.id);
			}
		}
	}

	return { score, consumedEffectIds };
}

/**
 * Phase 1 Guard execution: expires time-based effects whose expiresAt has passed,
 * and invokes guardCommand on all currently ACTIVE effects.
 */
export function runEffectGuards(
	action: GameAction,
	activeEffects: ActiveEffect[] | undefined,
	now: number,
	emit?: (event: DomainEvent) => void,
	roomId?: string,
): void {
	if (!activeEffects || activeEffects.length === 0) {
		return;
	}

	for (let i = activeEffects.length - 1; i >= 0; i--) {
		const effect = activeEffects[i];
		if (effect.status !== "ACTIVE") {
			continue;
		}
		const deadline = effect.expiresAt;
		if (deadline !== undefined && !effect.pausedAt && now >= deadline) {
			activeEffects.splice(i, 1);
			if (emit && roomId) {
				emit(
					new EffectExpiredDomainEvent(
						roomId,
						effect.id,
						effect.itemId,
					),
				);
			}
			continue;
		}
		const rule = EFFECT_REGISTRY[effect.itemId];
		rule?.guardCommand?.(action, effect, now);
	}
}

export { type EffectStatus } from "../state/game.state";
