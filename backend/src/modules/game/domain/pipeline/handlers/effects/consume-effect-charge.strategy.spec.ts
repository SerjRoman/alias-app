import { ConsumeEffectChargeStrategy } from "./effects-lifecycle.strategies";
import type {
	WordGuessedAction,
	WordSkippedAction,
} from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import type { ActiveEffect, GameState } from "../../../state/game.state";

describe("ConsumeEffectChargeStrategy", () => {
	const createMockContext = (
		action: WordGuessedAction | WordSkippedAction,
		effects: ActiveEffect[],
		consumedEffectIds?: string[],
	): ActionContext => {
		const state: GameState = {
			id: "room-1",
			ownerId: "owner-1",
			status: "IN_PROGRESS",
			pointsToWin: 30,
			teams: [{ id: "team-1", name: "Red", score: 0 }],
			players: [],
			bannedPlayerIds: [],
			activeTeamId: "team-1",
			currentRound: {
				id: "round-1",
				explainerId: "p1",
				teamId: "team-1",
				status: "IN_PROGRESS",
				currentWord: { id: "w-1", text: "Apple", score: 0 },
				words: [],
				roundNumber: 1,
				expiresAt: 1000,
			},
			activeEffects: effects,
			addons: {},
		};

		return {
			action,
			state,
			consumedEffectIds,
			emit: jest.fn(),
		};
	};

	it("decrements charges and consumes charge-based effect when charges reach 0", () => {
		const effects: ActiveEffect[] = [
			{
				id: "eff-shield",
				itemId: "FREE_SKIP_SHIELD",
				sourcePlayerId: "p1",
				targetTeamId: "team-1",
				status: "ACTIVE",
				charges: 1,
			},
		];

		const action: WordSkippedAction = {
			type: "WORD_SKIPPED",
			actorId: "p1",
			payload: { nextWordText: "Banana" },
		};

		const ctx = createMockContext(action, effects, ["eff-shield"]);
		const strategy = new ConsumeEffectChargeStrategy();

		strategy.handle(action, ctx);

		expect(ctx.state.activeEffects).toHaveLength(0);
	});

	it("decrements charges but keeps ACTIVE if remaining charges > 0", () => {
		const effects: ActiveEffect[] = [
			{
				id: "eff-multi-shield",
				itemId: "FREE_SKIP_SHIELD",
				sourcePlayerId: "p1",
				targetTeamId: "team-1",
				status: "ACTIVE",
				charges: 3,
			},
		];

		const action: WordSkippedAction = {
			type: "WORD_SKIPPED",
			actorId: "p1",
			payload: { nextWordText: "Banana" },
		};

		const ctx = createMockContext(action, effects, ["eff-multi-shield"]);
		const strategy = new ConsumeEffectChargeStrategy();

		strategy.handle(action, ctx);

		expect(effects[0].charges).toBe(2);
		expect(effects[0].status).toBe("ACTIVE");
	});

	it("does nothing if consumedEffectIds is empty or undefined", () => {
		const effects: ActiveEffect[] = [
			{
				id: "eff-shield",
				itemId: "FREE_SKIP_SHIELD",
				sourcePlayerId: "p1",
				targetTeamId: "team-1",
				status: "ACTIVE",
				charges: 1,
			},
		];

		const action: WordGuessedAction = {
			type: "WORD_GUESSED",
			actorId: "p1",
			payload: { nextWordText: "Banana" },
		};

		const ctx = createMockContext(action, effects, []);
		const strategy = new ConsumeEffectChargeStrategy();

		strategy.handle(action, ctx);

		expect(effects[0].charges).toBe(1);
		expect(effects[0].status).toBe("ACTIVE");
	});
});
