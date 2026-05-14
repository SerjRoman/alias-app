import { type HistoryRoundParticipantState } from "./types";

export class HistoryRoundParticipantEntity {
	private readonly state: HistoryRoundParticipantState;

	private constructor(state: HistoryRoundParticipantState) {
		this.state = { ...state };
	}

	get id() {
		return this.state.id;
	}
	get roundId() {
		return this.state.roundId;
	}
	get playerId() {
		return this.state.playerId;
	}
	get teamId() {
		return this.state.teamId;
	}
	get scoreAfterRound() {
		return this.state.scoreAfterRound;
	}

	toPrimitives(): HistoryRoundParticipantState {
		return { ...this.state };
	}

	static fromPrimitives(
		state: HistoryRoundParticipantState,
	): HistoryRoundParticipantEntity {
		return new HistoryRoundParticipantEntity(state);
	}
}
