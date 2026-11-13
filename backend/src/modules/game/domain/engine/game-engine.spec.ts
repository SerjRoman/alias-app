import type { GameAction } from "../actions/game.actions";
import {
	TeamCreatedDomainEvent,
	WordCycledDomainEvent,
	WordGuessedDomainEvent,
} from "../events/game.events";
import type {
	ActionContext,
	GamePipelineHandler,
} from "../pipeline/pipeline.types";
import type { GameState } from "../state/game.state";
import { DEFAULT_GAME_HANDLERS, GameEngine } from "./game-engine";

let idCounter = 0;
jest.mock("uuid", () => ({
	v4: () => `mock-uuid-${++idCounter}`,
}));

describe("GameEngine (Aggregate Root & Pipeline Dispatcher)", () => {
	const roomId = "test-room-1";
	const ownerId = "owner-123";

	describe("1. Initialization and Factory", () => {
		it("creates a new game with default lobby state and standard pipeline handlers", () => {
			const game = GameEngine.create(roomId, ownerId);

			const state = game.getState();
			expect(state.id).toBe(roomId);
			expect(state.ownerId).toBe(ownerId);
			expect(state.status).toBe("LOBBY");
			expect(state.teams).toEqual([]);
			expect(state.players).toEqual([]);
			expect(state.currentRound).toBeNull();
			expect(state.addons).toEqual({});
			expect(game.handlers).toHaveLength(DEFAULT_GAME_HANDLERS.length);
		});

		it("allows restoring an existing game state via fromPrimitives", () => {
			const existingState: GameState = {
				id: "restored-room",
				ownerId: "host-99",
				status: "IN_PROGRESS",
				pointsToWin: 40,
				teams: [{ id: "t1", name: "Red", color: "#FF0000", score: 12 }],
				players: [
					{ id: "p1", name: "Alice", teamId: "t1", isReady: true },
				],
				bannedPlayerIds: [],
				activeTeamId: "t1",
				currentRound: null,
				activeEffects: [],
				addons: { custom: { coins: 50 } },
			};

			const game = GameEngine.fromPrimitives(existingState);

			expect(game.getState()).toEqual(existingState);
			expect(
				(game.getState().addons.custom as { coins: number }).coins,
			).toBe(50);
		});

		it("initializes leftPlayers, ownerOfflineSince, and lastExplainerId defaults", () => {
			const game = GameEngine.create(roomId, ownerId, {
				teams: [{ id: "t1", name: "Red", score: 0 }],
			});

			const primitives = game.toPrimitives();
			expect(primitives.leftPlayers).toEqual([]);
			expect(primitives.ownerOfflineSince).toBeNull();
			expect(primitives.teams[0].lastExplainerId).toBeNull();
		});

		it("normalizes round pause fields when round is present", () => {
			const game = GameEngine.fromPrimitives({
				id: "paused-room",
				ownerId: "host-1",
				status: "IN_PROGRESS",
				pointsToWin: 30,
				teams: [{ id: "t1", name: "Red", score: 0 }],
				players: [
					{ id: "p1", name: "Alice", teamId: "t1", isReady: true },
				],
				bannedPlayerIds: [],
				activeTeamId: "t1",
				currentRound: {
					id: "round-1",
					teamId: "t1",
					explainerId: "p1",
					roundNumber: 1,
					status: "IN_PROGRESS",
					words: [],
					currentWord: null,
					expiresAt: 1000,
				},
				activeEffects: [],
				addons: {},
			});

			const primitives = game.toPrimitives();
			expect(primitives.currentRound?.pausedAt).toBeNull();
			expect(primitives.currentRound?.remainingMs).toBeNull();
		});
	});

	describe("2. Pipeline Dispatching & Context Lifecycle", () => {
		it("dispatches actions through the pipeline and collects domain events", () => {
			const game = GameEngine.create(roomId, ownerId);

			const action: GameAction = {
				type: "ADD_TEAM",
				payload: { teamId: "t1", name: "Vikings", color: "#FF0000" },
			};

			const result = game.dispatch(action);

			expect(result.state.teams).toHaveLength(1);
			expect(result.state.teams[0].name).toBe("Vikings");

			const events = game.pullDomainEvents();
			expect(events).toHaveLength(1);
			expect(events[0]).toBeInstanceOf(TeamCreatedDomainEvent);
			expect(game.pullDomainEvents()).toHaveLength(0);
		});

		it("executes custom pipeline handlers and applies activeEffects through the staged scoring pipeline", () => {
			const streakTrackerHandler: GamePipelineHandler = (
				ctx: ActionContext,
			) => {
				if (ctx.action.type === "WORD_GUESSED") {
					const currentStreak =
						typeof ctx.state.addons.streak === "number"
							? ctx.state.addons.streak
							: 0;
					ctx.state.addons.streak = currentStreak + 1;
				}
			};

			const customHandlers = [
				streakTrackerHandler,
				...DEFAULT_GAME_HANDLERS,
			];

			const initialState: GameState = {
				id: roomId,
				ownerId,
				status: "IN_PROGRESS",
				pointsToWin: 50,
				teams: [
					{ id: "t1", name: "Vikings", color: "#FF0000", score: 10 },
				],
				players: [
					{
						id: ownerId,
						name: "Ragnar",
						teamId: "t1",
						isReady: true,
					},
				],
				bannedPlayerIds: [],
				activeTeamId: "t1",
				currentRound: {
					id: "r1",
					explainerId: ownerId,
					teamId: "t1",
					status: "IN_PROGRESS",
					currentWord: { id: "w1", text: "VALHALLA", score: 0 },
					words: [],
					roundNumber: 1,
					expiresAt: Date.now() + 60000,
				},
				activeEffects: [
					{
						id: "eff-double-1",
						itemId: "DOUBLE_POINTS",
						sourcePlayerId: ownerId,
						targetTeamId: "t1",
						status: "ACTIVE",
					},
				],
				addons: {},
			};

			const game = GameEngine.fromPrimitives(
				initialState,
				customHandlers,
			);

			game.dispatch({
				type: "WORD_GUESSED",
				actorId: ownerId,
				payload: { nextWordText: "ODIN" },
			});

			const state = game.getState();

			expect(state.teams[0].score).toBe(12); // 10 + 2
			expect(state.addons.streak).toBe(1);

			const round = state.currentRound;
			expect(round?.words).toHaveLength(1);
			expect(round?.words[0].score).toBe(2);
			expect(round?.currentWord?.text).toBe("ODIN");

			const events = game.pullDomainEvents();
			expect(
				events.some((e) => e instanceof WordGuessedDomainEvent),
			).toBe(true);
			expect(events.some((e) => e instanceof WordCycledDomainEvent)).toBe(
				true,
			);
		});
	});

	describe("3. Full Match Simulation through Pipeline", () => {
		it("runs lobby setup -> start game -> play round -> pointing -> finish round seamlessly", () => {
			const game = GameEngine.create(roomId, ownerId, { pointsToWin: 2 });

			game.dispatch({
				type: "ADD_TEAM",
				payload: { teamId: "t1", name: "Red", color: "#FF0000" },
			});
			game.dispatch({
				type: "ADD_TEAM",
				payload: { teamId: "t2", name: "Blue", color: "#0000FF" },
			});

			game.getState().players = [
				{ id: "p1", name: "Alice", teamId: "t1", isReady: false },
				{ id: "p2", name: "Bob", teamId: "t2", isReady: true },
			];

			game.dispatch({
				type: "TOGGLE_READY",
				payload: { playerId: "p1" },
			});

			game.dispatch({
				type: "START_GAME",
				actorId: ownerId,
			});
			expect(game.getState().status).toBe("IN_PROGRESS");
			expect(game.getState().currentRound?.status).toBe("PENDING");

			game.dispatch({
				type: "START_ROUND",
				actorId: "p1",
				payload: { durationSeconds: 60, firstWordText: "APPLE" },
			});
			expect(game.getState().currentRound?.status).toBe("IN_PROGRESS");
			expect(game.getState().currentRound?.currentWord?.text).toBe(
				"APPLE",
			);

			game.dispatch({
				type: "WORD_GUESSED",
				actorId: "p1",
				payload: { nextWordText: "BANANA" },
			});
			expect(game.getState().teams[0].score).toBe(1);
			expect(game.getState().currentRound?.words).toHaveLength(1);
			expect(game.getState().currentRound?.currentWord?.text).toBe(
				"BANANA",
			);

			game.dispatch({
				type: "START_POINTING",
				actorId: ownerId,
			});
			expect(game.getState().currentRound?.status).toBe("POINTING");
			expect(game.getState().currentRound?.words).toHaveLength(2);

			const roundWords = game.getState().currentRound?.words;
			expect(roundWords).toBeDefined();
			const bananaWord = roundWords![1];
			game.dispatch({
				type: "CHANGE_WORD_OUTCOME",
				actorId: ownerId,
				payload: { wordId: bananaWord.id, outcome: "guessed" },
			});
			expect(bananaWord.score).toBe(1);
			expect(game.getState().teams[0].score).toBe(2);

			game.dispatch({
				type: "END_POINTING",
				actorId: ownerId,
			});
			expect(game.getState().status).toBe("FINISHED");

			const allEvents = game.pullDomainEvents();
			expect(allEvents.length).toBeGreaterThan(5);
		});
	});
});
