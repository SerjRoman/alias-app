import { HistoryRoundParticipantEntity } from "./history-round-participant.entity";
import { HistoryRoundState, HistoryRoundParticipantState } from "./types";

export class HistoryRoundEntity {
	private readonly state: Omit<HistoryRoundState, "participants">;
	private readonly _participants: HistoryRoundParticipantEntity[];

	private constructor(
		initial: Omit<HistoryRoundState, "participants">,
		participants: HistoryRoundParticipantState[],
	) {
		this.state = { ...initial };
		this._participants = participants?.map((p) =>
			HistoryRoundParticipantEntity.fromPrimitives(p),
		);
	}

	get id() {
		return this.state.id;
	}
	get gameId() {
		return this.state.gameId;
	}
	get teamId() {
		return this.state.teamId;
	}
	get guesserId() {
		return this.state.guesserId;
	}
	get words() {
		return [...this.state.words];
	}
	get roundNumber() {
		return this.state.roundNumber;
	}
	get participants() {
		return [...this._participants];
	}

	toPrimitives(): HistoryRoundState {
		return {
			...this.state,
			participants: this._participants.map((p) => p.toPrimitives()),
		};
	}

	static fromPrimitives(state: HistoryRoundState): HistoryRoundEntity {
		const { participants, ...rest } = state;
		return new HistoryRoundEntity(rest, participants);
	}
}
