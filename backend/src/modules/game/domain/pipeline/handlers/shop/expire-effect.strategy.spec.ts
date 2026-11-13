import { ExpireEffectStrategy } from "./expire-effect.strategy";
import { EffectExpiredDomainEvent } from "../../../events/game.events";
import type { GameState } from "../../../state/game.state";
import type { ExpireEffectAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";

describe("ExpireEffectStrategy", () => {
	const createMockState = (): GameState => ({
		id: "room-1",
		ownerId: "user-1",
		status: "IN_PROGRESS",
		pointsToWin: 30,
		teams: [],
		players: [],
		bannedPlayerIds: [],
		activeTeamId: null,
		currentRound: null,
		activeEffects: [
			{
				id: "eff-1",
				itemId: "VOICE_MUTE",
				sourcePlayerId: "user-1",
				targetPlayerId: "user-2",
				status: "ACTIVE",
				expiresAt: 5000,
			},
			{
				id: "eff-2",
				itemId: "FREEZE_NEXT_WORD",
				sourcePlayerId: "user-1",
				targetPlayerId: "user-2",
				status: "CONSUMED",
			},
		],
		addons: {},
	});

	const createMockContext = (
		state: GameState,
		action: ExpireEffectAction,
	): ActionContext => ({
		action,
		state,
		emit: jest.fn(),
		now: 5500,
	});

	it("removes ACTIVE effect from activeEffects and emits EffectExpiredDomainEvent", () => {
		const strategy = new ExpireEffectStrategy();
		const state = createMockState();
		const action: ExpireEffectAction = {
			type: "EXPIRE_EFFECT",
			actorId: "system",
			payload: { effectId: "eff-1" },
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		const eff = state.activeEffects?.find((e) => e.id === "eff-1");
		expect(eff).toBeUndefined();

		expect(ctx.emit).toHaveBeenCalledWith(
			expect.any(EffectExpiredDomainEvent),
		);
		expect(ctx.emit).toHaveBeenCalledWith(
			expect.objectContaining({
				roomId: "room-1",
				effectId: "eff-1",
				itemId: "VOICE_MUTE",
			}),
		);
	});

	it("does nothing if effect is already CONSUMED", () => {
		const strategy = new ExpireEffectStrategy();
		const state = createMockState();
		const action: ExpireEffectAction = {
			type: "EXPIRE_EFFECT",
			actorId: "system",
			payload: { effectId: "eff-2" },
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(ctx.emit).not.toHaveBeenCalled();
	});

	it("does nothing if effectId is not found", () => {
		const strategy = new ExpireEffectStrategy();
		const state = createMockState();
		const action: ExpireEffectAction = {
			type: "EXPIRE_EFFECT",
			actorId: "system",
			payload: { effectId: "non-existent" },
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(ctx.emit).not.toHaveBeenCalled();
	});
});
