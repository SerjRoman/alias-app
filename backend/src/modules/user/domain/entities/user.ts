import { v4 as uuidv4 } from "uuid";
import { BaseEntity } from "@common/domain/base-entity";

export interface UserState {
	id: string;
	email: string;
	name: string;
	username: string;
	password: string;
	avatarUrl: string;
	totalGamesPlayed: number;
	totalWins: number;
	totalScore: number;
	createdAt: number;
}

export class UserEntity extends BaseEntity {
	private readonly state: UserState;

	private constructor(state: UserState) {
		super();
		this.state = { ...state };
	}

	// Getters
	get id() {
		return this.state.id;
	}
	get email() {
		return this.state.email;
	}
	get password() {
		return this.state.password;
	}
	get username() {
		return this.state.username;
	}
	get avatarUrl() {
		return this.state.avatarUrl;
	}
	get totalGamesPlayed() {
		return this.state.totalGamesPlayed;
	}
	get totalWins() {
		return this.state.totalWins;
	}
	get totalScore() {
		return this.state.totalScore;
	}
	get name() {
		return this.state.name;
	}

	updateProfile(data: {
		name?: string;
		username?: string;
		avatarUrl?: string;
	}) {
		if (data.username) this.state.username = data.username;
		if (data.name) this.state.name = data.name;
		if (data.avatarUrl) this.state.avatarUrl = data.avatarUrl;
	}

	addGameResult(score: number, isWin: boolean) {
		this.state.totalGamesPlayed += 1;
		this.state.totalScore += score;
		if (isWin) {
			this.state.totalWins += 1;
		}
	}

	toPrimitives(): UserState {
		return { ...this.state };
	}

	static fromPrimitives(state: UserState): UserEntity {
		return new UserEntity(state);
	}

	static create(
		email: string,
		name: string,
		username: string,
		password: string,
		avatarUrl: string = "default-avatar.png",
	): UserEntity {
		return new UserEntity({
			id: uuidv4(),
			email,
			name,
			username,
			password,
			avatarUrl,
			totalGamesPlayed: 0,
			totalWins: 0,
			totalScore: 0,
			createdAt: Date.now(),
		});
	}
}
