import { NegativePointsError } from "../errors/game.errors";

export interface PlayerState {
	id: string;
	name: string;
	isReady: boolean;
	isRoundReady: boolean;
	score: number;
}

export class PlayerEntity {
	private readonly state: PlayerState;

	private constructor(state: PlayerState) {
		this.state = {
			...state,
		};
	}
	get id() {
		return this.state.id;
	}
	get score() {
		return this.state.score;
	}
	get isReady() {
		return this.state.isReady;
	}
	get isRoundReady() {
		return this.state.isRoundReady;
	}

	toggleReady() {
		this.state.isReady = !this.state.isReady;
	}

	setRoundReady(status: boolean) {
		this.state.isRoundReady = status;
	}

	addScore(points: number) {
		if (points < 0) throw new NegativePointsError(points);
		this.state.score += points;
	}

	resetState() {
		this.state.isReady = false;
		this.state.isRoundReady = false;
		this.state.score = 0;
	}
	toPrimitives() {
		return {
			...this.state,
		};
	}
	static fromPrimitives(state: PlayerState) {
		return new PlayerEntity({ ...state });
	}
	static create(id: string, name: string): PlayerEntity {
		return new PlayerEntity({
			id,
			name,
			isReady: false,
			isRoundReady: false,
			score: 0,
		});
	}
}
