import { WordCyclingGuardStrategy } from "./word-cycle.strategies";
import { RoundStatus, type GameState } from "../../../state/game.state";
import {
	NoActiveWordError,
	RoundIsNotInProgress,
	UserIsNotExplainerError,
} from "../../../errors/round.errors";
import { NoActiveTeamError } from "../../../errors/team.errors";
import type { WordGuessedAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";

describe("WordCyclingGuardStrategy", () => {
	const createMockState = (
		overrides: Partial<GameState> = {},
	): GameState => ({
		id: "room-1",
		ownerId: "user-1",
		status: "IN_PROGRESS",
		pointsToWin: 30,
		teams: [
			{
				id: "team-1",
				name: "Red",
				color: "#FF0000",
				score: 0,
				playerIds: ["user-1"],
			},
		],
		players: [
			{
				id: "user-1",
				name: "Alice",
				role: "registered",
				isReady: true,
				isRoundReady: false,
				isOnline: true,
				teamId: "team-1",
			},
		],
		bannedPlayerIds: [],
		activeTeamId: "team-1",
		currentRound: {
			id: "r-1",
			teamId: "team-1",
			explainerId: "user-1",
			status: RoundStatus.IN_PROGRESS,
			roundNumber: 1,
			expiresAt: 10_000,
			words: [],
			currentWord: { id: "w-1", text: "Apple", score: 0 },
		},
		activeEffects: [],
		addons: {},
		...overrides,
	});

	const createMockContext = (
		state: GameState,
		actorId: string = "user-1",
	): ActionContext => {
		const action: WordGuessedAction = {
			type: "WORD_GUESSED",
			actorId,
			payload: { nextWordText: "Banana" },
		};
		return {
			action,
			state,
			emit: jest.fn(),
		};
	};

	it("passes when all invariants are satisfied", () => {
		const strategy = new WordCyclingGuardStrategy();
		const state = createMockState();
		const ctx = createMockContext(state);

		expect(() =>
			strategy.handle(ctx.action as WordGuessedAction, ctx),
		).not.toThrow();
	});

	it("throws RoundIsNotInProgress if round is not IN_PROGRESS", () => {
		const strategy = new WordCyclingGuardStrategy();
		const state = createMockState();
		state.currentRound!.status = RoundStatus.POINTING;
		const ctx = createMockContext(state);

		expect(() =>
			strategy.handle(ctx.action as WordGuessedAction, ctx),
		).toThrow(RoundIsNotInProgress);
	});

	it("throws UserIsNotExplainerError if actor is not the explainer", () => {
		const strategy = new WordCyclingGuardStrategy();
		const state = createMockState();
		const ctx = createMockContext(state, "other-user");

		expect(() =>
			strategy.handle(ctx.action as WordGuessedAction, ctx),
		).toThrow(UserIsNotExplainerError);
	});

	it("throws NoActiveWordError if currentRound has no currentWord", () => {
		const strategy = new WordCyclingGuardStrategy();
		const state = createMockState();
		state.currentRound!.currentWord = null;
		const ctx = createMockContext(state);

		expect(() =>
			strategy.handle(ctx.action as WordGuessedAction, ctx),
		).toThrow(NoActiveWordError);
	});

	it("throws NoActiveTeamError if state has no matching active team", () => {
		const strategy = new WordCyclingGuardStrategy();
		const state = createMockState({ activeTeamId: "non-existent" });
		const ctx = createMockContext(state);

		expect(() =>
			strategy.handle(ctx.action as WordGuessedAction, ctx),
		).toThrow(NoActiveTeamError);
	});
});
