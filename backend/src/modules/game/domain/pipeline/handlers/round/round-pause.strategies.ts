import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type {
	PauseGameAction,
	ResumeGameAction,
} from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import { RoundStatus } from "../../../state/game.state";
import { pauseTimer, resumeTimer } from "../../../time";

export class PauseRoundStrategy implements ActionStrategy<PauseGameAction> {
	readonly actionType = "PAUSE_GAME" as const;

	handle(_action: PauseGameAction, ctx: ActionContext): void {
		const { state, now } = ctx;
		const round = state.currentRound;
		if (round?.status === RoundStatus.IN_PROGRESS && !round.pausedAt) {
			pauseTimer(round, now ?? Date.now());
		}
	}
}

export class ResumeRoundStrategy implements ActionStrategy<ResumeGameAction> {
	readonly actionType = "RESUME_GAME" as const;

	handle(_action: ResumeGameAction, ctx: ActionContext): void {
		const { state, now } = ctx;
		const round = state.currentRound;
		if (round?.status === RoundStatus.IN_PROGRESS && round.pausedAt) {
			resumeTimer(round, now ?? Date.now());
		}
	}
}
