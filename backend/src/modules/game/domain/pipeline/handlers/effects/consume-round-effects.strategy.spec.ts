import { ConsumeRoundEffectsStrategy } from "./effects-lifecycle.strategies";
import type { EndPointingAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import type { ActiveEffect, GameState } from "../../../state/game.state";

describe("ConsumeRoundEffectsStrategy", () => {
	const createMockContext = (
		roundTeamId: string,
		effects: ActiveEffect[],
	): { ctx: ActionContext; action: EndPointingAction } => {
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
				status: "FINISHED",
				currentWord: null,
				words: [],
				roundNumber: 1,
				expiresAt: 1000,
			},
			activeEffects: effects,
			addons: {},
		};

		const action: EndPointingAction = {
			type: "END_POINTING",
			actorId: "owner-1",
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

	it("consumes all ACTIVE round-scoped effects targeting the finished round team", () => {
		const effects: ActiveEffect[] = [
			{
				id: "eff-1",
				itemId: "DOUBLE_POINTS", // durationType: "round"
				sourcePlayerId: "p1",
				targetTeamId: "team-1",
				status: "ACTIVE",
			},
			{
				id: "eff-2",
				itemId: "ENEMY_SKIP_PENALTY", // durationType: "round"
				sourcePlayerId: "p2",
				targetTeamId: "team-1",
				status: "ACTIVE",
			},
			{
				id: "eff-3",
				itemId: "FREE_SKIP_SHIELD", // durationType: "charges" - NOT round!
				sourcePlayerId: "p1",
				targetTeamId: "team-1",
				status: "ACTIVE",
				charges: 1,
			},
			{
				id: "eff-4",
				itemId: "DOUBLE_POINTS",
				sourcePlayerId: "p3",
				targetTeamId: "team-2", // Other team
				status: "ACTIVE",
			},
		];

		const { ctx, action } = createMockContext("team-1", effects);
		const strategy = new ConsumeRoundEffectsStrategy();

		strategy.handle(action, ctx);

		// Round-scoped effects for team-1 are removed
		expect(ctx.state.activeEffects?.map((e) => e.id)).toEqual([
			"eff-3",
			"eff-4",
		]);
		expect(effects[3].status).toBe("ACTIVE");
	});

	it("leaves ARMED effects untouched even if targeting this team", () => {
		const effects: ActiveEffect[] = [
			{
				id: "eff-1",
				itemId: "DOUBLE_POINTS",
				sourcePlayerId: "p1",
				targetTeamId: "team-1",
				status: "ARMED",
			},
		];

		const { ctx, action } = createMockContext("team-1", effects);
		const strategy = new ConsumeRoundEffectsStrategy();

		strategy.handle(action, ctx);

		expect(effects[0].status).toBe("ARMED");
	});

	it("does nothing if state has no activeEffects array or round is null", () => {
		const { ctx, action } = createMockContext("team-1", []);
		(ctx.state as any).activeEffects = undefined;
		const strategy = new ConsumeRoundEffectsStrategy();

		expect(() => strategy.handle(action, ctx)).not.toThrow();
	});
});
