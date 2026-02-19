import { PlayerAlreadyInTeamError } from "../../../../common/errors/team.errors";
import { v4 as uuidv4 } from "uuid";
import { TeamIsEmptyError, TeamNameEmptyError } from "../errors/team.errors";

export interface TeamState {
	id: string;
	name: string;
	playerIds: string[];
	score: number;
	lastGuesserIndex: number;
}
export class TeamEntity {
	private readonly state: Omit<TeamState, "playerIds">;
	private readonly _playerIds: Set<string>;
	private constructor(
		state: Omit<TeamState, "playerIds">,
		playerIds: string[],
	) {
		this.state = state;
		this._playerIds = new Set(playerIds);
	}

	get id() {
		return this.state.id;
	}
	get name() {
		return this.state.name;
	}
	get playerIds() {
		return this._playerIds;
	}
	get score() {
		return this.state.score;
	}
	addPlayer(playerId: string) {
		if (!this._playerIds.has(playerId)) {
			this._playerIds.add(playerId);
			return;
		}
		throw new PlayerAlreadyInTeamError();
	}
	rename(newName: string) {
		if (!newName) throw new TeamNameEmptyError();
		this.state.name = newName;
	}

	removePlayer(playerId: string) {
		this._playerIds.delete(playerId);
	}
	addScore(points: number) {
		this.state.score += points;
	}
	getNextGuesserId(): string {
		if (this._playerIds.size === 0) throw new TeamIsEmptyError();
		const newGuesserIndex =
			this._playerIds.size === 1
				? 0
				: (this.state.lastGuesserIndex + 1) % this._playerIds.size;
		this.state.lastGuesserIndex = newGuesserIndex;
		const playerIds = Array.from(this._playerIds);
		return playerIds[newGuesserIndex];
	}

	toPrimitives(): TeamState {
		return {
			...this.state,
			playerIds: Array.from(this._playerIds),
		};
	}
	static fromPrimitives(state: TeamState) {
		const { playerIds, ...rest } = state;
		return new TeamEntity(rest, playerIds);
	}
	static create(name: string): TeamEntity {
		return new TeamEntity(
			{
				id: uuidv4(),
				name,
				score: 0,
				lastGuesserIndex: -1,
			},
			[],
		);
	}
}
