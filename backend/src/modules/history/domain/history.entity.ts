import { HistoryParticipantEntity } from "./history-participant.entity";
import { HistoryRoundEntity } from "./history-round.entity";
import { HistoryTeamEntity } from "./history-team.entity";
import {
	HistoryGameState,
	HistoryRoundState,
	HistoryParticipantState,
	HistoryTeamState,
} from "./types";

export class HistoryGameEntity {
	private readonly state: Omit<
		HistoryGameState,
		"rounds" | "participants" | "teams"
	>;
	private _rounds: HistoryRoundEntity[];
	private _participants: HistoryParticipantEntity[];
	private _teams: HistoryTeamEntity[];

	private constructor(
		initial: Omit<HistoryGameState, "rounds" | "participants" | "teams">,
		rounds: HistoryRoundState[],
		participants: HistoryParticipantState[],
		teams: HistoryTeamState[],
	) {
		this.state = { ...initial };
		this._rounds = rounds.map((r) => HistoryRoundEntity.fromPrimitives(r));
		this._participants = participants.map((p) =>
			HistoryParticipantEntity.fromPrimitives(p),
		);
		this._teams = teams.map((t) => HistoryTeamEntity.fromPrimitives(t));
	}

	get id() {
		return this.state.id;
	}
	get ownerId() {
		return this.state.ownerId;
	}
	get status() {
		return this.state.status;
	}
	get winnerTeamId() {
		return this.state.winnerTeamId;
	}
	get settings() {
		return { ...this.state.settings };
	}
	get teamsFinalState() {
		return [...this.state.teamsFinalState];
	}
	get playersFinalState() {
		return [...this.state.playersFinalState];
	}
	get createdAt() {
		return this.state.createdAt;
	}
	get updatedAt() {
		return this.state.updatedAt;
	}

	get rounds() {
		return [...this._rounds];
	}
	get participants() {
		return [...this._participants];
	}
	get teams() {
		return [...this._teams];
	}
	set teams(teams: HistoryTeamEntity[]) {
		this._teams = teams;
	}
	set participants(participants: HistoryParticipantEntity[]) {
		this._participants = participants;
	}
	set rounds(rounds: HistoryRoundEntity[]) {
		this._rounds = rounds;
	}
	set status(status: string) {
		this.state.status = status;
	}
	set winnerTeamId(winnerTeamId: string | null) {
		this.state.winnerTeamId = winnerTeamId;
	}
	set playersFinalState(
		playersFinalState: HistoryGameState["playersFinalState"],
	) {
		this.state.playersFinalState = playersFinalState;
	}
	set teamsFinalState(teamsFinalState: HistoryGameState["teamsFinalState"]) {
		this.state.teamsFinalState = teamsFinalState;
	}
	set updatedAt(updatedAt: Date) {
		this.state.updatedAt = updatedAt;
	}

	toPrimitives(): HistoryGameState {
		return {
			...this.state,
			rounds: this._rounds.map((r) => r.toPrimitives()),
			participants: this._participants.map((p) => p.toPrimitives()),
			teams: this._teams.map((t) => t.toPrimitives()),
		};
	}

	static fromPrimitives(state: HistoryGameState): HistoryGameEntity {
		const { rounds, participants, teams, ...rest } = state;
		return new HistoryGameEntity(rest, rounds, participants, teams);
	}
}
