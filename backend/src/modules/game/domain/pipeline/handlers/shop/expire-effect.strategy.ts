import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type { ExpireEffectAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import { EffectExpiredDomainEvent } from "../../../events/game.events";

export class ExpireEffectStrategy implements ActionStrategy<ExpireEffectAction> {
	readonly actionType = "EXPIRE_EFFECT" as const;

	handle(action: ExpireEffectAction, ctx: ActionContext): void {
		const { state, emit } = ctx;
		if (!state.activeEffects || state.activeEffects.length === 0) {
			return;
		}

		const { effectId } = action.payload;
		const index = state.activeEffects.findIndex((e) => e.id === effectId);
		if (index === -1) {
			return;
		}

		const effect = state.activeEffects[index];
		if (!effect || effect.status !== "ACTIVE") {
			return;
		}

		state.activeEffects.splice(index, 1);
		emit(new EffectExpiredDomainEvent(state.id, effect.id, effect.itemId));
	}
}
