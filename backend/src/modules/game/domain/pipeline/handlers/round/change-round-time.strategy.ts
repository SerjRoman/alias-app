import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type { ChangeRoundTimeAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import { RoundStatus } from "../../../state/game.state";
import {
	GameNotInProgressError,
	PlayerNotRoomOwnerError,
} from "../../../errors/game.errors";
import {
	RoundIsNotInProgress,
	RoundNotActiveError,
} from "../../../errors/round.errors";

export class ChangeRoundTimeStrategy implements ActionStrategy<ChangeRoundTimeAction> {
	readonly actionType = "CHANGE_ROUND_TIME" as const;

	handle(action: ChangeRoundTimeAction, ctx: ActionContext): void {
		const { state } = ctx;
		const round = state.currentRound;

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

		round.expiresAt = action.payload.expiresAt;
	}
}
