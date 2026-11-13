import { ActivateArmedEffectsStrategy } from "./effects-lifecycle.strategies";
import type { StartRoundAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import type { ActiveEffect, GameState } from "../../../state/game.state";

describe("ActivateArmedEffectsStrategy", () => {
	const createMockContext = (
		roundTeamId: string,
		effects: ActiveEffect[],
	): { ctx: ActionContext; action: StartRoundAction } => {
		const state: GameState = {
			id: "room-1",
			ownerId: "owner-1",
			status: "IN_PROGRESS",
			pointsToWin: 30,
			teams: [
				{ id: "team-1", name: "Red", score: 0 },
				{ id: "team-2", name: "Blue", score: 0 },
			],
			players: [],
			bannedPlayerIds: [],
			activeTeamId: roundTeamId,
			currentRound: {
				id: "round-1",
				explainerId: "p1",
				teamId: roundTeamId,
				status: "IN_PROGRESS",
				currentWord: null,
				words: [],
				roundNumber: 1,
				expiresAt: 1000,
			},
			activeEffects: effects,
			addons: {},
		};

		const action: StartRoundAction = {
			type: "START_ROUND",
			actorId: "owner-1",
			payload: { durationSeconds: 60 },
		};

		return {
			action,
			ctx: {
				action,
				state,
				emit: jest.fn(),
			},
		};
	};

	it("activates all ARMED effects targeting the playing team", () => {
		const effects: ActiveEffect[] = [
			{
				id: "eff-1",
				itemId: "DOUBLE_POINTS",
				sourcePlayerId: "p1",
				targetTeamId: "team-1",
				status: "ARMED",
			},
			{
				id: "eff-2",
				itemId: "ENEMY_SKIP_PENALTY",
				sourcePlayerId: "p2",
				targetTeamId: "team-1",
				status: "ARMED",
			},
			{
				id: "eff-3",
				itemId: "DOUBLE_POINTS",
				sourcePlayerId: "p3",
				targetTeamId: "team-2", // Другая команда
				status: "ARMED",
			},
		];

		const { ctx, action } = createMockContext("team-1", effects);
		const strategy = new ActivateArmedEffectsStrategy();

		strategy.handle(action, ctx);

		expect(effects[0].status).toBe("ACTIVE");
		expect(effects[1].status).toBe("ACTIVE");
		// Эффект команды team-2 не должен стать ACTIVE!
		expect(effects[2].status).toBe("ARMED");
	});

	it("leaves already ACTIVE or CONSUMED effects untouched", () => {
		const effects: ActiveEffect[] = [
			{
				id: "eff-1",
				itemId: "DOUBLE_POINTS",
				sourcePlayerId: "p1",
				targetTeamId: "team-1",
				status: "CONSUMED",
			},
		];

		const { ctx, action } = createMockContext("team-1", effects);
		const strategy = new ActivateArmedEffectsStrategy();

		strategy.handle(action, ctx);

		expect(effects[0].status).toBe("CONSUMED");
	});

	it("does nothing if state has no activeEffects array", () => {
		const { ctx, action } = createMockContext("team-1", []);
		(ctx.state as any).activeEffects = undefined;
		const strategy = new ActivateArmedEffectsStrategy();

		expect(() => strategy.handle(action, ctx)).not.toThrow();
	});
});
