import { type HistoryParticipantState } from "./types";

export class HistoryParticipantEntity {
	private readonly state: HistoryParticipantState;

	private constructor(state: HistoryParticipantState) {
		this.state = { ...state };
	}

	get id() {
		return this.state.id;
	}
	get userId() {
		return this.state.userId;
	}
	get name() {
		return this.state.name;
	}
	get teamId() {
		return this.state.teamId;
	}
	get finalScore() {
		return this.state.finalScore;
	}

	toPrimitives(): HistoryParticipantState {
		return { ...this.state };
	}

	static fromPrimitives(
		state: HistoryParticipantState,
	): HistoryParticipantEntity {
		return new HistoryParticipantEntity(state);
	}
}
