import { HistoryTeamState } from "./types";

export class HistoryTeamEntity {
	private readonly state: HistoryTeamState;

	private constructor(state: HistoryTeamState) {
		this.state = { ...state };
	}

	get id() {
		return this.state.id;
	}
	get name() {
		return this.state.name;
	}

	toPrimitives(): HistoryTeamState {
		return { ...this.state };
	}

	static fromPrimitives(state: HistoryTeamState): HistoryTeamEntity {
		return new HistoryTeamEntity(state);
	}
}
