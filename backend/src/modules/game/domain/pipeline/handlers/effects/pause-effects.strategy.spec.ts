import { PauseEffectsStrategy } from "./effects-pause.strategies";
import { ResumeEffectsStrategy } from "./effects-pause.strategies";
import { type GameState } from "../../../state/game.state";
import type {
	PauseGameAction,
	ResumeGameAction,
} from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";

describe("PauseEffectsStrategy & ResumeEffectsStrategy", () => {
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
				id: "eff-freeze",
				itemId: "FREEZE_NEXT_WORD",
				sourcePlayerId: "user-1",
				targetPlayerId: "user-2",
				status: "ACTIVE",
				durationMs: 5000,
				expiresAt: 10_000,
			},
			{
				id: "eff-shield",
				itemId: "FREE_SKIP_SHIELD",
				sourcePlayerId: "user-1",
				targetTeamId: "team-1",
				status: "ACTIVE",
				charges: 1, // no expiresAt, not a seconds effect
			},
		],
		addons: {},
	});

	it("pauses active timed effects on PAUSE_GAME", () => {
		const strategy = new PauseEffectsStrategy();
		const state = createMockState();
		const action: PauseGameAction = { type: "PAUSE_GAME" };
		const ctx: ActionContext = {
			action,
			state,
			emit: jest.fn(),
			now: 7_000,
		};

		strategy.handle(action, ctx);

		const freezeEff = state.activeEffects?.find(
			(e) => e.id === "eff-freeze",
		);
		expect(freezeEff?.pausedAt).toBe(7_000);
		expect(freezeEff?.remainingMs).toBe(3_000);

		const shieldEff = state.activeEffects?.find(
			(e) => e.id === "eff-shield",
		);
		expect(shieldEff?.pausedAt).toBeUndefined();

		expect(ctx.emit).toHaveBeenCalledWith(
			expect.objectContaining({
				roomId: "room-1",
				pausedAt: 7_000,
				roundRemainingMs: null,
				effectsRemaining: [
					{
						effectId: "eff-freeze",
						remainingMs: 3_000,
					},
				],
			}),
		);
	});

	it("resumes paused timed effects on RESUME_GAME", () => {
		const pauseStrat = new PauseEffectsStrategy();
		const resumeStrat = new ResumeEffectsStrategy();
		const state = createMockState();

		const pauseCtx: ActionContext = {
			action: { type: "PAUSE_GAME" },
			state,
			emit: jest.fn(),
			now: 7_000,
		};
		pauseStrat.handle(pauseCtx.action as PauseGameAction, pauseCtx);

		const resumeCtx: ActionContext = {
			action: { type: "RESUME_GAME" },
			state,
			emit: jest.fn(),
			now: 15_000,
		};
		resumeStrat.handle(resumeCtx.action as ResumeGameAction, resumeCtx);

		const freezeEff = state.activeEffects?.find(
			(e) => e.id === "eff-freeze",
		);
		expect(freezeEff?.expiresAt).toBe(18_000); // 15_000 + 3_000
		expect(freezeEff?.pausedAt).toBeNull();
		expect(freezeEff?.remainingMs).toBeNull();

		expect(resumeCtx.emit).toHaveBeenCalledWith(
			expect.objectContaining({
				roomId: "room-1",
				resumedAt: 15_000,
				roundExpiresAt: null,
				effectsDeadlines: [
					{
						effectId: "eff-freeze",
						expiresAt: 18_000,
					},
				],
			}),
		);
	});
});
