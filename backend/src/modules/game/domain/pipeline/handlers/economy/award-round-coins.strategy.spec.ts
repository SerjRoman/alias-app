import { AwardRoundCoinsStrategy } from "./award-round-coins.strategy";
import { EconomyService } from "../../../economy";
import { RoundStatus, type GameState } from "../../../state/game.state";
import type { EndPointingAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";

describe("AwardRoundCoinsStrategy", () => {
	const createMockState = (): GameState => ({
		id: "room-1",
		ownerId: "user-1",
		status: "IN_PROGRESS",
		pointsToWin: 30,
		teams: [
			{
				id: "team-1",
				name: "Team 1",
				color: "#FF0000",
				score: 10,
				playerIds: ["user-1", "user-2"],
			},
			{
				id: "team-2",
				name: "Team 2",
				color: "#0000FF",
				score: 5,
				playerIds: ["user-3"],
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
			{
				id: "user-2",
				name: "Bob",
				role: "registered",
				isReady: true,
				isRoundReady: false,
				isOnline: true,
				teamId: "team-1",
			},
			{
				id: "user-3",
				name: "Charlie",
				role: "registered",
				isReady: true,
				isRoundReady: false,
				isOnline: true,
				teamId: "team-2",
			},
		],
		bannedPlayerIds: [],
		activeTeamId: "team-1",
		currentRound: {
			id: "round-1",
			roundNumber: 1,
			teamId: "team-1",
			explainerId: "user-1",
			status: RoundStatus.FINISHED,
			currentWord: null,
			words: [
				{ id: "w-1", text: "Apple", score: 1, outcome: "guessed" },
				{ id: "w-2", text: "Banana", score: -1, outcome: "skipped" },
				{ id: "w-3", text: "Cherry", score: 1, outcome: "guessed" },
				{ id: "w-4", text: "Date", score: 1, outcome: "guessed" },
			],
			expiresAt: 1000,
		},
		activeEffects: [],
		addons: {},
	});

	const createMockContext = (
		state: GameState,
		action: EndPointingAction,
	): ActionContext => ({
		action,
		state,
		emit: jest.fn(),
		now: 2000,
	});

	it("awards coins to explainer and guessers on END_POINTING based on guessed words count", () => {
		const strategy = new AwardRoundCoinsStrategy();
		const state = createMockState();
		const action: EndPointingAction = {
			type: "END_POINTING",
			actorId: "system",
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		// 3 guessed words -> explainer gets 3 * 2 = 6, guesser gets 3 * 1 = 3
		expect(EconomyService.getBalance(state, "user-1")).toBe(6);
		expect(EconomyService.getBalance(state, "user-2")).toBe(3);
		expect(EconomyService.getBalance(state, "user-3")).toBe(0);

		const slice = EconomyService.getSlice(state);
		expect(slice.ledger).toHaveLength(2);
		expect(slice.ledger[0]).toMatchObject({
			playerId: "user-1",
			delta: 6,
			reason: "round_guessed_words",
			timestamp: 2000,
		});
		expect(slice.ledger[1]).toMatchObject({
			playerId: "user-2",
			delta: 3,
			reason: "round_guessed_words",
			timestamp: 2000,
		});
	});

	it("does not award any coins if no words were guessed", () => {
		const strategy = new AwardRoundCoinsStrategy();
		const state = createMockState();
		state.currentRound!.words = [
			{ id: "w-1", text: "Apple", score: -1, outcome: "skipped" },
			{ id: "w-2", text: "Banana", score: 0, outcome: "neutral" },
		];
		const action: EndPointingAction = {
			type: "END_POINTING",
			actorId: "system",
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(EconomyService.getBalance(state, "user-1")).toBe(0);
		expect(EconomyService.getBalance(state, "user-2")).toBe(0);
		expect(EconomyService.getSlice(state).ledger).toHaveLength(0);
	});

	it("handles round without teammates gracefully", () => {
		const strategy = new AwardRoundCoinsStrategy();
		const state = createMockState();
		// Make team 1 have only user-1
		state.teams[0].playerIds = ["user-1"];
		const action: EndPointingAction = {
			type: "END_POINTING",
			actorId: "system",
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(EconomyService.getBalance(state, "user-1")).toBe(6);
		expect(EconomyService.getSlice(state).ledger).toHaveLength(1);
	});

	it("does nothing if there is no currentRound", () => {
		const strategy = new AwardRoundCoinsStrategy();
		const state = createMockState();
		state.currentRound = null;
		const action: EndPointingAction = {
			type: "END_POINTING",
			actorId: "system",
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(EconomyService.getBalance(state, "user-1")).toBe(0);
		expect(EconomyService.getSlice(state).ledger).toHaveLength(0);
	});

	it("supports custom EconomyRewardsConfig in constructor", () => {
		const strategy = new AwardRoundCoinsStrategy({
			coinsPerGuessedWordExplainer: 5,
			coinsPerGuessedWordGuesser: 4,
		});
		const state = createMockState();
		const action: EndPointingAction = {
			type: "END_POINTING",
			actorId: "system",
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		// 3 guessed words -> explainer gets 3 * 5 = 15, guesser gets 3 * 4 = 12
		expect(EconomyService.getBalance(state, "user-1")).toBe(15);
		expect(EconomyService.getBalance(state, "user-2")).toBe(12);
	});

	it("does not award coins if isShopEnabled is false in settings", () => {
		const strategy = new AwardRoundCoinsStrategy();
		const state = createMockState();
		state.settings = {
			name: "Room",
			roundTimeSeconds: 60,
			pointsToWin: 30,
			code: null,
			isPrivate: false,
			wordPackSelections: [],
			wordsPerPlayer: 0,
			isHatMode: false,
			isOnlyOwnerCanNextRound: false,
			isOnlyOwnerCanChangeScore: false,
			isVoiceChatEnabled: true,
			isShopEnabled: false,
		};
		const action: EndPointingAction = {
			type: "END_POINTING",
			actorId: "system",
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(EconomyService.getBalance(state, "user-1")).toBe(0);
		expect(EconomyService.getBalance(state, "user-2")).toBe(0);
		expect(EconomyService.getSlice(state).ledger).toHaveLength(0);
	});
});
