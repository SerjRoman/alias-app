import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type { ToggleRoundReadyAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import { PlayerNotFoundError } from "../../../errors/game.errors";

export class ToggleRoundReadyStrategy implements ActionStrategy<ToggleRoundReadyAction> {
	readonly actionType = "TOGGLE_ROUND_READY" as const;

	handle(action: ToggleRoundReadyAction, ctx: ActionContext): void {
		const { state } = ctx;
		const playerId = action.payload?.playerId ?? action.actorId ?? "";
		const player = state.players.find((p) => p.id === playerId);
		if (!player) {
			throw new PlayerNotFoundError(playerId);
		}
		player.isRoundReady = !player.isRoundReady;
	}
}
