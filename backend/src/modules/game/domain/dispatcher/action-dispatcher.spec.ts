import { ActionDispatcher, type ActionStrategy } from "./action-dispatcher";
import type { ActionContext } from "../pipeline/pipeline.types";
import type { GameState } from "../state/game.state";
import type { GameAction, StartGameAction } from "../actions/game.actions";

describe("ActionDispatcher", () => {
	const createMockContext = (action: GameAction): ActionContext => {
		const state: GameState = {
			id: "room-1",
			ownerId: "u-1",
			status: "LOBBY",
			pointsToWin: 30,
			teams: [],
			players: [],
			bannedPlayerIds: [],
			activeTeamId: null,
			currentRound: null,
			activeEffects: [],
			addons: {},
		};

		return {
			action,
			state,
			emit: jest.fn(),
		};
	};

	it("dispatches to a registered functional strategy", () => {
		const dispatcher = new ActionDispatcher();
		const handler = jest.fn();

		dispatcher.register("START_GAME", handler);

		const action: GameAction = { type: "START_GAME", actorId: "u-1" };
		const ctx = createMockContext(action);

		const handled = dispatcher.dispatch(ctx);

		expect(handled).toBe(true);
		expect(handler).toHaveBeenCalledWith(action, ctx);
	});

	it("dispatches to a registered class-based ActionStrategy", () => {
		const dispatcher = new ActionDispatcher();

		const strategy: ActionStrategy<StartGameAction> = {
			actionType: "START_GAME",
			handle: jest.fn(),
		};

		dispatcher.registerAll([strategy]);

		const action: GameAction = { type: "START_GAME", actorId: "u-1" };
		const ctx = createMockContext(action);

		const handled = dispatcher.dispatch(ctx);

		expect(handled).toBe(true);
		expect(strategy.handle).toHaveBeenCalledWith(action, ctx);
	});

	it("dispatches to a strategy registered with multiple action types as an array", () => {
		const dispatcher = new ActionDispatcher();

		const strategy: ActionStrategy<GameAction> = {
			actionType: ["WORD_GUESSED", "WORD_SKIPPED"] as const,
			handle: jest.fn(),
		};

		dispatcher.registerAll([strategy]);

		const guessAction: GameAction = {
			type: "WORD_GUESSED",
			actorId: "u-1",
			payload: { nextWordText: "Apple" },
		};
		const skipAction: GameAction = {
			type: "WORD_SKIPPED",
			actorId: "u-1",
			payload: { nextWordText: "Banana" },
		};

		expect(dispatcher.dispatch(createMockContext(guessAction))).toBe(true);
		expect(dispatcher.dispatch(createMockContext(skipAction))).toBe(true);
		expect(strategy.handle).toHaveBeenCalledTimes(2);
	});

	it("returns false if no strategy is registered for the action", () => {
		const dispatcher = new ActionDispatcher();
		const action: GameAction = { type: "END_POINTING", actorId: "u-1" };
		const ctx = createMockContext(action);

		const handled = dispatcher.dispatch(ctx);

		expect(handled).toBe(false);
	});

	it("calls multiple strategies registered for the same action in registration order", () => {
		const dispatcher = new ActionDispatcher();
		const order: number[] = [];

		dispatcher.register("WORD_GUESSED", () => {
			order.push(1);
		});
		dispatcher.register("WORD_GUESSED", () => {
			order.push(2);
		});

		const action: GameAction = {
			type: "WORD_GUESSED",
			actorId: "u-1",
			payload: { nextWordText: "Apple" },
		};
		const ctx = createMockContext(action);

		const handled = dispatcher.dispatch(ctx);

		expect(handled).toBe(true);
		expect(order).toEqual([1, 2]);
	});

	it("wraps into a GamePipelineHandler via asHandler()", () => {
		const dispatcher = new ActionDispatcher();
		const fn = jest.fn();
		dispatcher.register("SHUFFLE_PLAYERS", fn);

		const pipelineHandler = dispatcher.asHandler();
		const action: GameAction = { type: "SHUFFLE_PLAYERS", actorId: "u-1" };
		const ctx = createMockContext(action);

		pipelineHandler(ctx);

		expect(fn).toHaveBeenCalledWith(action, ctx);
	});
});
