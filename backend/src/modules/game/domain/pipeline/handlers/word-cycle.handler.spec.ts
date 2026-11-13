import type { DomainEvent } from "@common/domain/domain-event";
import { UserIsNotExplainerError } from "../../errors/round.errors";
import { WordCycledDomainEvent } from "../../events/game.events";
import type { GameState } from "../../state/game.state";
import type { ActionContext } from "../pipeline.types";
import { wordCycleHandler } from "./word-cycle";

jest.mock("uuid", () => ({
	v4: () => "mocked-uuid",
}));

describe("wordCycleHandler", () => {
	const createInitialState = (overrides?: Partial<GameState>): GameState => ({
		id: "room-1",
		ownerId: "p1",
		status: "IN_PROGRESS",
		pointsToWin: 50,
		teams: [{ id: "team-1", name: "Red Team", color: "#FF0000", score: 0 }],
		players: [{ id: "p1", name: "Alice", teamId: "team-1", isReady: true }],
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
		payload?: { nextWordText?: string },
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

	describe("Word Cycling", () => {
		it("moves currentWord to words history with score 1, outcome 'guessed', and appliedEffectIds on WORD_GUESSED", () => {
			const { ctx, emittedEvents } = createActionContext("WORD_GUESSED", {
				nextWordText: "KANGAROO",
			});

			wordCycleHandler(ctx);

			const round = ctx.state.currentRound!;
			expect(round.words).toHaveLength(1);
			expect(round.words[0]).toEqual({
				id: "w-1",
				text: "ELEPHANT",
				score: 1,
				outcome: "guessed",
				appliedEffectIds: [],
			});

			expect(round.currentWord).toEqual({
				id: "mocked-uuid",
				text: "KANGAROO",
				score: 0,
			});

			expect(emittedEvents).toHaveLength(1);
			expect(emittedEvents[0]).toBeInstanceOf(WordCycledDomainEvent);
			const cycledEvent = emittedEvents[0] as WordCycledDomainEvent;
			expect(cycledEvent.previousWord.text).toBe("ELEPHANT");
			expect(cycledEvent.previousWord.score).toBe(1);
			expect(cycledEvent.nextWord?.text).toBe("KANGAROO");
		});

		it("records resolvedWordScore and resolvedEffectIds from scoringHandler when present", () => {
			const { ctx, emittedEvents } = createActionContext(
				"WORD_GUESSED",
				{ nextWordText: "KANGAROO" },
				{},
				{
					resolvedWordScore: 2,
					resolvedEffectIds: ["eff-double-1"],
				},
			);

			wordCycleHandler(ctx);

			const round = ctx.state.currentRound!;
			expect(round.words[0]).toEqual({
				id: "w-1",
				text: "ELEPHANT",
				score: 2,
				outcome: "guessed",
				appliedEffectIds: ["eff-double-1"],
			});
			const scoredEvent = emittedEvents[0] as WordCycledDomainEvent;
			expect(scoredEvent.previousWord.score).toBe(2);
		});

		it("moves currentWord to words history with score -1 and outcome 'skipped' on WORD_SKIPPED", () => {
			const { ctx, emittedEvents } = createActionContext("WORD_SKIPPED", {
				nextWordText: "GIRAFFE",
			});

			wordCycleHandler(ctx);

			const round = ctx.state.currentRound!;
			expect(round.words).toHaveLength(1);
			expect(round.words[0]).toEqual({
				id: "w-1",
				text: "ELEPHANT",
				score: -1,
				outcome: "skipped",
				appliedEffectIds: [],
			});

			expect(round.currentWord).toEqual({
				id: "mocked-uuid",
				text: "GIRAFFE",
				score: 0,
			});
			expect(emittedEvents).toHaveLength(1);
			const skippedEvent = emittedEvents[0] as WordCycledDomainEvent;
			expect(skippedEvent.previousWord.score).toBe(-1);
		});

		it("moves currentWord to history with score 0 if FREE_SKIP_SHIELD resolvedWordScore is 0", () => {
			const { ctx } = createActionContext(
				"WORD_SKIPPED",
				{ nextWordText: "ZEBRA" },
				{},
				{
					resolvedWordScore: 0,
					resolvedEffectIds: ["eff-shield-1"],
				},
			);

			wordCycleHandler(ctx);

			const round = ctx.state.currentRound!;
			expect(round.words).toHaveLength(1);
			expect(round.words[0].score).toBe(0);
			expect(round.words[0].outcome).toBe("skipped");
			expect(round.words[0].appliedEffectIds).toEqual(["eff-shield-1"]);
		});

		it("sets currentWord to null if nextWordText is undefined (dictionary empty)", () => {
			const { ctx, emittedEvents } = createActionContext(
				"WORD_GUESSED",
				{},
			);

			wordCycleHandler(ctx);

			const round = ctx.state.currentRound!;
			expect(round.currentWord).toBeNull();
			const emptyDictEvent = emittedEvents[0] as WordCycledDomainEvent;
			expect(emptyDictEvent.nextWord).toBeNull();
		});

		it("does nothing when currentWord is already null", () => {
			const { ctx, emittedEvents } = createActionContext(
				"WORD_GUESSED",
				{ nextWordText: "TIGER" },
				{
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
				},
			);

			wordCycleHandler(ctx);

			const round = ctx.state.currentRound!;
			expect(round.currentWord).toBeNull();
			expect(round.words).toHaveLength(0);
			expect(emittedEvents).toHaveLength(0);
		});

		it("does nothing when currentRound is null", () => {
			const { ctx } = createActionContext(
				"WORD_GUESSED",
				{ nextWordText: "TIGER" },
				{
					currentRound: null,
				},
			);

			wordCycleHandler(ctx);

			expect(ctx.state.currentRound).toBeNull();
		});

		it("does nothing when currentRound status is not IN_PROGRESS", () => {
			const { ctx } = createActionContext(
				"WORD_GUESSED",
				{ nextWordText: "TIGER" },
				{
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
				},
			);

			wordCycleHandler(ctx);

			const round = ctx.state.currentRound!;
			expect(round.words).toHaveLength(0);
			expect(round.currentWord?.id).toBe("w-1");
		});

		it("throws UserIsNotExplainerError if an actor other than the round explainer attempts to cycle words", () => {
			const { ctx } = createActionContext("WORD_GUESSED", {
				nextWordText: "TIGER",
			});
			ctx.action.actorId = "intruder-player";

			expect(() => wordCycleHandler(ctx)).toThrow(
				UserIsNotExplainerError,
			);
		});

		it("ignores unrelated action types", () => {
			const { ctx, emittedEvents } =
				createActionContext("SOME_OTHER_ACTION");

			wordCycleHandler(ctx);

			const round = ctx.state.currentRound!;
			expect(round.currentWord?.id).toBe("w-1");
			expect(round.words).toHaveLength(0);
			expect(emittedEvents).toHaveLength(0);
		});
	});
});
