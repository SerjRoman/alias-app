import type { DomainEvent } from "@common/domain/domain-event";
import {
	NoActiveWordError,
	RoundIsNotInProgress,
	UserIsNotExplainerError,
} from "../../errors/round.errors";
import { NoActiveTeamError } from "../../errors/team.errors";
import {
	WordGuessedDomainEvent,
	WordSkippedDomainEvent,
} from "../../events/game.events";
import type { GameState } from "../../state/game.state";
import type { ActionContext } from "../pipeline.types";
import { scoringHandler } from "./scoring";

describe("scoringHandler", () => {
	const createInitialState = (overrides?: Partial<GameState>): GameState => ({
		id: "room-1",
		ownerId: "p1",
		status: "IN_PROGRESS",
		pointsToWin: 50,
		teams: [
			{ id: "team-1", name: "Red Team", color: "#FF0000", score: 10 },
			{ id: "team-2", name: "Blue Team", color: "#0000FF", score: 5 },
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
		stateOverrides?: Partial<GameState>,
	): { ctx: ActionContext; emittedEvents: DomainEvent[] } => {
		const emittedEvents: DomainEvent[] = [];
		const ctx: ActionContext = {
			action: { type: actionType, actorId: "p1" },
			state: createInitialState(stateOverrides),
			emit: (event) => emittedEvents.push(event),
		};
		return { ctx, emittedEvents };
	};

	describe("1. WORD_GUESSED scoring", () => {
		it("awards base 1 point, populates resolvedWordScore & resolvedEffectIds, and emits WordGuessedDomainEvent", () => {
			const { ctx, emittedEvents } = createActionContext("WORD_GUESSED");

			scoringHandler(ctx);

			const activeTeam = ctx.state.teams.find((t) => t.id === "team-1");
			expect(activeTeam?.score).toBe(11);
			expect(ctx.resolvedWordScore).toBe(1);
			expect(ctx.resolvedEffectIds).toEqual([]);

			expect(emittedEvents).toHaveLength(1);
			const event = emittedEvents[0] as WordGuessedDomainEvent;
			expect(event).toBeInstanceOf(WordGuessedDomainEvent);
			expect(event.scoreDelta).toBe(1);
			expect(event.totalTeamScore).toBe(11);
			expect(event.wordText).toBe("ELEPHANT");
		});

		it("applies DOUBLE_POINTS active effect from staged scoring pipeline (+2 points)", () => {
			const { ctx, emittedEvents } = createActionContext("WORD_GUESSED", {
				activeEffects: [
					{
						id: "eff-double-1",
						itemId: "DOUBLE_POINTS",
						sourcePlayerId: "p1",
						targetTeamId: "team-1",
						status: "ACTIVE",
					},
				],
			});

			scoringHandler(ctx);

			const activeTeam = ctx.state.teams.find((t) => t.id === "team-1");
			expect(activeTeam?.score).toBe(12);
			expect(ctx.resolvedWordScore).toBe(2);
			expect(ctx.resolvedEffectIds).toEqual(["eff-double-1"]);

			const event = emittedEvents[0] as WordGuessedDomainEvent;
			expect(event.scoreDelta).toBe(2);
			expect(event.totalTeamScore).toBe(12);
		});
	});

	describe("2. WORD_SKIPPED scoring", () => {
		it("applies -1 point penalty and emits WordSkippedDomainEvent", () => {
			const { ctx, emittedEvents } = createActionContext("WORD_SKIPPED");

			scoringHandler(ctx);

			const activeTeam = ctx.state.teams.find((t) => t.id === "team-1");
			expect(activeTeam?.score).toBe(9);
			expect(ctx.resolvedWordScore).toBe(-1);

			expect(emittedEvents).toHaveLength(1);
			const event = emittedEvents[0] as WordSkippedDomainEvent;
			expect(event).toBeInstanceOf(WordSkippedDomainEvent);
			expect(event.penalty).toBe(-1);
			expect(event.wordText).toBe("ELEPHANT");
		});

		it("applies ENEMY_SKIP_PENALTY active effect (-2 penalty)", () => {
			const { ctx, emittedEvents } = createActionContext("WORD_SKIPPED", {
				activeEffects: [
					{
						id: "eff-pen-1",
						itemId: "ENEMY_SKIP_PENALTY",
						sourcePlayerId: "p2",
						targetTeamId: "team-1",
						status: "ACTIVE",
					},
				],
			});

			scoringHandler(ctx);

			const activeTeam = ctx.state.teams.find((t) => t.id === "team-1");
			expect(activeTeam?.score).toBe(8);
			expect(ctx.resolvedWordScore).toBe(-2);
			expect(ctx.resolvedEffectIds).toEqual(["eff-pen-1"]);

			const event = emittedEvents[0] as WordSkippedDomainEvent;
			expect(event.penalty).toBe(-2);
		});

		it("overrides skip penalty to 0 and consumes charge when FREE_SKIP_SHIELD is ACTIVE", () => {
			const { ctx, emittedEvents } = createActionContext("WORD_SKIPPED", {
				activeEffects: [
					{
						id: "eff-pen-1",
						itemId: "ENEMY_SKIP_PENALTY",
						sourcePlayerId: "p2",
						targetTeamId: "team-1",
						status: "ACTIVE",
					},
					{
						id: "eff-shield-1",
						itemId: "FREE_SKIP_SHIELD",
						sourcePlayerId: "p1",
						targetTeamId: "team-1",
						status: "ACTIVE",
						charges: 1,
					},
				],
			});

			scoringHandler(ctx);

			const activeTeam = ctx.state.teams.find((t) => t.id === "team-1");
			expect(activeTeam?.score).toBe(10);
			expect(ctx.resolvedWordScore).toBe(0);

			expect(ctx.consumedEffectIds).toEqual(["eff-shield-1"]);

			const event = emittedEvents[0] as WordSkippedDomainEvent;
			expect(event.penalty).toBe(0);
		});

		it("does not allow team score to drop below 0", () => {
			const { ctx } = createActionContext("WORD_SKIPPED", {
				teams: [
					{
						id: "team-1",
						name: "Red Team",
						color: "#FF0000",
						score: 0,
					},
				],
			});

			scoringHandler(ctx);

			const activeTeam = ctx.state.teams.find((t) => t.id === "team-1");
			expect(activeTeam?.score).toBe(0);
		});
	});

	describe("3. Invariants and guard assertions", () => {
		it("throws NoActiveTeamError if no active team is set", () => {
			const { ctx } = createActionContext("WORD_GUESSED", {
				activeTeamId: null,
			});

			expect(() => scoringHandler(ctx)).toThrow(NoActiveTeamError);
		});

		it("throws NoActiveWordError if no current word is available", () => {
			const { ctx } = createActionContext("WORD_GUESSED", {
				currentRound: {
					id: "r-1",
					explainerId: "p1",
					teamId: "team-1",
					status: "IN_PROGRESS",
					currentWord: null,
					words: [],
					roundNumber: 1,
					expiresAt: Date.now() + 60000,
				},
			});

			expect(() => scoringHandler(ctx)).toThrow(NoActiveWordError);
		});

		it("throws RoundIsNotInProgress if currentRound is not IN_PROGRESS", () => {
			const { ctx } = createActionContext("WORD_GUESSED", {
				currentRound: {
					id: "r-1",
					explainerId: "p1",
					teamId: "team-1",
					status: "POINTING",
					currentWord: { id: "w-1", text: "ELEPHANT", score: 0 },
					words: [],
					roundNumber: 1,
					expiresAt: Date.now(),
				},
			});

			expect(() => scoringHandler(ctx)).toThrow(RoundIsNotInProgress);
			expect(ctx.state.teams[0].score).toBe(10);
		});

		it("throws UserIsNotExplainerError without mutating team score if actor is not the round explainer", () => {
			const { ctx } = createActionContext("WORD_GUESSED");
			ctx.action.actorId = "p2";

			expect(() => scoringHandler(ctx)).toThrow(UserIsNotExplainerError);
			expect(ctx.state.teams[0].score).toBe(10);
		});

		it("ignores unrelated action types without mutating score or emitting", () => {
			const { ctx, emittedEvents } =
				createActionContext("SOME_OTHER_ACTION");

			scoringHandler(ctx);

			const activeTeam = ctx.state.teams.find((t) => t.id === "team-1");
			expect(activeTeam?.score).toBe(10);
			expect(emittedEvents).toHaveLength(0);
		});
	});
});
