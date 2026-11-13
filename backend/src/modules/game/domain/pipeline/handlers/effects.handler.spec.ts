import type { DomainEvent } from "@common/domain/domain-event";
import type { GameState } from "../../state/game.state";
import type { ActionContext } from "../pipeline.types";
import { effectsHandler } from "./effects";

describe("effectsHandler", () => {
	const createInitialState = (overrides?: Partial<GameState>): GameState => ({
		id: "room-1",
		ownerId: "p1",
		status: "IN_PROGRESS",
		pointsToWin: 50,
		teams: [
			{ id: "team-1", name: "Red Team", color: "#FF0000", score: 0 },
			{ id: "team-2", name: "Blue Team", color: "#0000FF", score: 0 },
		],
		players: [
			{ id: "p1", name: "Alice", teamId: "team-1", isReady: true },
			{ id: "p2", name: "Bob", teamId: "team-2", isReady: true },
		],
		bannedPlayerIds: [],
		activeTeamId: "team-1",
		currentRound: {
			id: "r-1",
			explainerId: "p1",
			teamId: "team-1",
			status: "IN_PROGRESS",
			currentWord: { id: "w-1", text: "ELEPHANT", score: 0 },
			words: [],
			roundNumber: 1,
			expiresAt: Date.now() + 60000,
		},
		activeEffects: [],
		addons: {},
		...overrides,
	});

	const createActionContext = (
		actionType: string,
		payload?: unknown,
		stateOverrides?: Partial<GameState>,
		contextOverrides?: Partial<ActionContext>,
	): { ctx: ActionContext; emittedEvents: DomainEvent[] } => {
		const emittedEvents: DomainEvent[] = [];
		const ctx: ActionContext = {
			action: { type: actionType, actorId: "p1", payload },
			state: createInitialState(stateOverrides),
			emit: (event) => emittedEvents.push(event),
			...contextOverrides,
		};
		return { ctx, emittedEvents };
	};

	it("dispatches WORD_SKIPPED and consumes charges from ctx.consumedEffectIds", () => {
		const { ctx } = createActionContext(
			"WORD_SKIPPED",
			{},
			{
				activeEffects: [
					{
						id: "eff-1",
						itemId: "FREE_SKIP_SHIELD",
						sourcePlayerId: "p1",
						targetTeamId: "team-1",
						status: "ACTIVE",
						charges: 1,
					},
				],
			},
			{
				consumedEffectIds: ["eff-1"],
			},
		);

		effectsHandler(ctx);

		expect(
			ctx.state.activeEffects?.find((e) => e.id === "eff-1"),
		).toBeUndefined();
	});

	it("dispatches START_ROUND and activates ARMED effects", () => {
		const { ctx } = createActionContext(
			"START_ROUND",
			{},
			{
				activeEffects: [
					{
						id: "eff-freeze",
						itemId: "FREEZE_NEXT_WORD",
						sourcePlayerId: "p2",
						targetPlayerId: "p1",
						status: "ARMED",
						durationMs: 5000,
					},
				],
			},
		);

		effectsHandler(ctx);

		const effect = ctx.state.activeEffects?.find(
			(e) => e.id === "eff-freeze",
		);
		expect(effect?.status).toBe("ACTIVE");
	});

	it("dispatches END_POINTING and deactivates round-scoped effects", () => {
		const { ctx } = createActionContext(
			"END_POINTING",
			{},
			{
				activeEffects: [
					{
						id: "eff-round",
						itemId: "DOUBLE_POINTS",
						sourcePlayerId: "p1",
						targetTeamId: "team-1",
						status: "ACTIVE",
					},
				],
			},
		);

		effectsHandler(ctx);

		expect(
			ctx.state.activeEffects?.find((e) => e.id === "eff-round"),
		).toBeUndefined();
	});

	it("dispatches PAUSE_GAME and pauses active effect timers", () => {
		const { ctx, emittedEvents } = createActionContext(
			"PAUSE_GAME",
			{},
			{
				activeEffects: [
					{
						id: "eff-timer",
						itemId: "FREEZE_NEXT_WORD",
						sourcePlayerId: "p2",
						targetPlayerId: "p1",
						status: "ACTIVE",
						expiresAt: Date.now() + 5000,
					},
				],
			},
		);

		effectsHandler(ctx);

		const effect = ctx.state.activeEffects?.find(
			(e) => e.id === "eff-timer",
		);
		expect(effect?.pausedAt).toBeDefined();
		expect(effect?.remainingMs).toBeGreaterThan(0);
		expect(emittedEvents.some((e) => e.name === "GamePausedEvent")).toBe(
			true,
		);
	});

	it("dispatches RESUME_GAME and resumes paused effect timers", () => {
		const { ctx, emittedEvents } = createActionContext(
			"RESUME_GAME",
			{},
			{
				activeEffects: [
					{
						id: "eff-timer",
						itemId: "FREEZE_NEXT_WORD",
						sourcePlayerId: "p2",
						targetPlayerId: "p1",
						status: "ACTIVE",
						expiresAt: Date.now() + 3000,
						pausedAt: Date.now() - 1000,
						remainingMs: 4000,
					},
				],
			},
		);

		effectsHandler(ctx);

		const effect = ctx.state.activeEffects?.find(
			(e) => e.id === "eff-timer",
		);
		expect(effect?.pausedAt).toBeNull();
		expect(effect?.remainingMs).toBeNull();
		expect(effect?.expiresAt).toBeGreaterThan(Date.now());
		expect(emittedEvents.some((e) => e.name === "GameResumedEvent")).toBe(
			true,
		);
	});
});
