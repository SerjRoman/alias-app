import type { DomainEvent } from "@common/domain/domain-event";
import type { GameAction } from "../../actions/game.actions";
import {
	NotRoundExplainerError,
	PlayerNotRoomOwnerError,
} from "../../errors/game.errors";
import {
	RoundIsNotFinished,
	RoundIsNotInProgress,
	RoundIsNotPending,
	RoundIsNotPointing,
	WordInRoundNotFound,
} from "../../errors/round.errors";
import { TeamHasNoOnlinePlayersError } from "../../errors/team.errors";
import {
	RoundCreatedDomainEvent,
	RoundEndedDomainEvent,
	RoundPointingStartedDomainEvent,
	RoundStartedDomainEvent,
	WordScoreChangedDomainEvent,
} from "../../events/game.events";
import type { GameState } from "../../state/game.state";
import type { ActionContext } from "../pipeline.types";
import { roundFlowHandler } from "./round";

jest.mock("uuid", () => ({
	v4: () => "mocked-round-uuid",
}));

describe("roundFlowHandler", () => {
	const createInitialState = (overrides?: Partial<GameState>): GameState => ({
		id: "room-1",
		ownerId: "host-1",
		status: "IN_PROGRESS",
		pointsToWin: 30,
		teams: [
			{ id: "team-1", name: "Team Red", color: "#FF0000", score: 10 },
			{ id: "team-2", name: "Team Blue", color: "#0000FF", score: 8 },
		],
		players: [
			{ id: "p1", name: "Alice", teamId: "team-1", isReady: true },
			{ id: "p2", name: "Bob", teamId: "team-1", isReady: true },
			{ id: "p3", name: "Charlie", teamId: "team-2", isReady: true },
		],
		bannedPlayerIds: [],
		activeTeamId: "team-1",
		currentRound: {
			id: "r-1",
			explainerId: "p1",
			teamId: "team-1",
			status: "PENDING",
			currentWord: null,
			words: [],
			roundNumber: 1,
			expiresAt: 0,
		},
		activeEffects: [],
		addons: {},
		...overrides,
	});

	const createActionContext = (
		action: GameAction,
		stateOverrides?: Partial<GameState>,
	): { ctx: ActionContext; emittedEvents: DomainEvent[] } => {
		const emittedEvents: DomainEvent[] = [];
		const ctx: ActionContext = {
			action,
			state: createInitialState(stateOverrides),
			emit: (event) => emittedEvents.push(event),
		};
		return { ctx, emittedEvents };
	};

	describe("1. START_ROUND", () => {
		it("transitions round from PENDING to IN_PROGRESS, sets expiresAt, initializes first word, and emits RoundStartedDomainEvent", () => {
			const { ctx, emittedEvents } = createActionContext({
				type: "START_ROUND",
				actorId: "p1",
				payload: { durationSeconds: 60, firstWordText: "SUNSHINE" },
			});

			roundFlowHandler(ctx);

			const round = ctx.state.currentRound!;
			expect(round.status).toBe("IN_PROGRESS");
			expect(round.expiresAt).toBeGreaterThan(Date.now());
			expect(round.currentWord).toEqual({
				id: "mocked-round-uuid",
				text: "SUNSHINE",
				score: 0,
			});

			expect(emittedEvents).toHaveLength(1);
			expect(emittedEvents[0]).toBeInstanceOf(RoundStartedDomainEvent);
			const roundStartedEvent =
				emittedEvents[0] as RoundStartedDomainEvent;
			expect(roundStartedEvent.roundId).toBe("r-1");
			expect(roundStartedEvent.teamId).toBe("team-1");
			expect(roundStartedEvent.explainerId).toBe("p1");
		});

		it("throws RoundIsNotPending if round is not in PENDING state", () => {
			const { ctx } = createActionContext(
				{
					type: "START_ROUND",
					actorId: "p1",
					payload: { durationSeconds: 60 },
				},
				{
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "IN_PROGRESS",
						currentWord: null,
						words: [],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			expect(() => roundFlowHandler(ctx)).toThrow(RoundIsNotPending);
		});

		it("throws NotRoundExplainerError if actor is not the explainer or room owner", () => {
			const { ctx } = createActionContext({
				type: "START_ROUND",
				actorId: "stranger",
				payload: { durationSeconds: 60 },
			});

			expect(() => roundFlowHandler(ctx)).toThrow(NotRoundExplainerError);
		});

		it("throws TeamHasNoOnlinePlayersError on START_ROUND if any team has 0 online players", () => {
			const { ctx } = createActionContext(
				{
					type: "START_ROUND",
					actorId: "p1",
					payload: { durationSeconds: 60 },
				},
				{
					players: [
						{
							id: "p1",
							name: "Alice",
							teamId: "team-1",
							isReady: true,
							isOnline: true,
						},
						{
							id: "p2",
							name: "Bob",
							teamId: "team-1",
							isReady: true,
							isOnline: true,
						},
						{
							id: "p3",
							name: "Charlie",
							teamId: "team-2",
							isReady: true,
							isOnline: false,
						}, // team-2 has no online players
					],
				},
			);

			expect(() => roundFlowHandler(ctx)).toThrow(
				TeamHasNoOnlinePlayersError,
			);
		});

		it("throws NotRoundExplainerError on START_ROUND if explainer is offline", () => {
			const { ctx } = createActionContext(
				{
					type: "START_ROUND",
					actorId: "host-1",
					payload: { durationSeconds: 60, force: true },
				},
				{
					players: [
						{
							id: "p1",
							name: "Alice",
							teamId: "team-1",
							isReady: true,
							isOnline: false,
						}, // explainer offline!
						{
							id: "p2",
							name: "Bob",
							teamId: "team-1",
							isReady: true,
							isOnline: true,
						},
						{
							id: "p3",
							name: "Charlie",
							teamId: "team-2",
							isReady: true,
							isOnline: true,
						},
					],
				},
			);

			expect(() => roundFlowHandler(ctx)).toThrow(NotRoundExplainerError);
		});
	});

	describe("2. START_POINTING", () => {
		it("transitions round to POINTING, archives currentWord with score 0, and emits RoundPointingStartedDomainEvent", () => {
			const { ctx, emittedEvents } = createActionContext(
				{ type: "START_POINTING", actorId: "host-1" },
				{
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "IN_PROGRESS",
						currentWord: { id: "w-last", text: "PLANET", score: 0 },
						words: [{ id: "w-1", text: "STAR", score: 1 }],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			roundFlowHandler(ctx);

			const round = ctx.state.currentRound!;
			expect(round.status).toBe("POINTING");
			expect(round.currentWord).toBeNull();
			expect(round.words).toHaveLength(2);
			expect(round.words[1]).toEqual({
				id: "w-last",
				text: "PLANET",
				score: 0,
				outcome: "neutral",
				appliedEffectIds: [],
			});

			expect(emittedEvents).toHaveLength(1);
			expect(emittedEvents[0]).toBeInstanceOf(
				RoundPointingStartedDomainEvent,
			);
			const pointingEvent =
				emittedEvents[0] as RoundPointingStartedDomainEvent;
			expect(pointingEvent.roundId).toBe("r-1");
			expect(pointingEvent.words).toHaveLength(2);
		});

		it("throws RoundIsNotInProgress if round is not IN_PROGRESS", () => {
			const { ctx } = createActionContext({ type: "START_POINTING" });

			expect(() => roundFlowHandler(ctx)).toThrow(RoundIsNotInProgress);
		});
	});

	describe("3. CHANGE_WORD_SCORE", () => {
		it("updates word score and team score accordingly", () => {
			const { ctx, emittedEvents } = createActionContext(
				{
					type: "CHANGE_WORD_SCORE",
					actorId: "host-1",
					payload: { wordId: "w-2", delta: 1 },
				},
				{
					teams: [
						{
							id: "team-1",
							name: "Team Red",
							color: "#FF0000",
							score: 10,
						},
					],
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "POINTING",
						currentWord: null,
						words: [
							{ id: "w-1", text: "SUN", score: 1 },
							{ id: "w-2", text: "MOON", score: 0 },
						],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			roundFlowHandler(ctx);

			expect(ctx.state.currentRound!.words[1].score).toBe(1);
			expect(ctx.state.teams[0].score).toBe(11);

			expect(emittedEvents).toHaveLength(1);
			expect(emittedEvents[0]).toBeInstanceOf(
				WordScoreChangedDomainEvent,
			);
			const scoreChangedEvent =
				emittedEvents[0] as WordScoreChangedDomainEvent;
			expect(scoreChangedEvent.newScore).toBe(1);
			expect(scoreChangedEvent.teamScore).toBe(11);
		});

		it("clamps word score between -1 and 1", () => {
			const { ctx } = createActionContext(
				{
					type: "CHANGE_WORD_SCORE",
					actorId: "host-1",
					payload: { wordId: "w-1", delta: 5 },
				},
				{
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "POINTING",
						currentWord: null,
						words: [{ id: "w-1", text: "GALAXY", score: 0 }],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			roundFlowHandler(ctx);

			const round = ctx.state.currentRound!;
			expect(round.words[0].score).toBe(1);
		});

		it("throws RoundIsNotPointing if round is not in POINTING status", () => {
			const { ctx } = createActionContext({
				type: "CHANGE_WORD_SCORE",
				payload: { wordId: "w-1", delta: 1 },
			});

			expect(() => roundFlowHandler(ctx)).toThrow(RoundIsNotPointing);
		});

		it("throws WordInRoundNotFound if word is not found in round words history", () => {
			const { ctx } = createActionContext(
				{
					type: "CHANGE_WORD_SCORE",
					payload: { wordId: "w-unknown", delta: 1 },
				},
				{
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "POINTING",
						currentWord: null,
						words: [{ id: "w-1", text: "GALAXY", score: 0 }],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			expect(() => roundFlowHandler(ctx)).toThrow(WordInRoundNotFound);
		});
	});

	describe("4. END_POINTING", () => {
		it("sets round status to FINISHED and emits RoundEndedDomainEvent", () => {
			const { ctx, emittedEvents } = createActionContext(
				{ type: "END_POINTING", actorId: "host-1" },
				{
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "POINTING",
						currentWord: null,
						words: [
							{ id: "w-1", text: "A", score: 1 },
							{ id: "w-2", text: "B", score: -1 },
						],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			roundFlowHandler(ctx);

			expect(ctx.state.currentRound!.status).toBe("FINISHED");
			expect(ctx.state.status).toBe("IN_PROGRESS");

			expect(emittedEvents).toHaveLength(1);
			expect(emittedEvents[0]).toBeInstanceOf(RoundEndedDomainEvent);
			const roundEndedEvent = emittedEvents[0] as RoundEndedDomainEvent;
			expect(roundEndedEvent.isGameFinished).toBe(false);
		});

		it("finishes the game when pointsToWin is reached", () => {
			const { ctx, emittedEvents } = createActionContext(
				{ type: "END_POINTING" },
				{
					pointsToWin: 20,
					teams: [
						{
							id: "team-1",
							name: "Team Red",
							color: "#FF0000",
							score: 25,
						},
						{
							id: "team-2",
							name: "Team Blue",
							color: "#0000FF",
							score: 5,
						},
					],
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "POINTING",
						currentWord: null,
						words: [],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			roundFlowHandler(ctx);

			expect(ctx.state.status).toBe("FINISHED");
			const gameFinishedRoundEvent =
				emittedEvents[0] as RoundEndedDomainEvent;
			expect(gameFinishedRoundEvent.isGameFinished).toBe(true);
		});

		it("throws RoundIsNotPointing if round is not in POINTING status", () => {
			const { ctx } = createActionContext({ type: "END_POINTING" });

			expect(() => roundFlowHandler(ctx)).toThrow(RoundIsNotPointing);
		});
	});

	describe("5. NEXT_ROUND", () => {
		it("creates next round, advances activeTeamId cyclically, and picks next explainer", () => {
			const { ctx, emittedEvents } = createActionContext(
				{ type: "NEXT_ROUND", actorId: "host-1" },
				{
					activeTeamId: "team-1",
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "FINISHED",
						currentWord: null,
						words: [],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			roundFlowHandler(ctx);

			expect(ctx.state.activeTeamId).toBe("team-2");
			const newRound = ctx.state.currentRound!;
			expect(newRound.id).toBe("mocked-round-uuid");
			expect(newRound.teamId).toBe("team-2");
			expect(newRound.explainerId).toBe("p3");
			expect(newRound.status).toBe("PENDING");
			expect(newRound.roundNumber).toBe(2);
			expect(newRound.words).toEqual([]);
			expect(newRound.currentWord).toBeNull();

			expect(emittedEvents).toHaveLength(1);
			expect(emittedEvents[0]).toBeInstanceOf(RoundCreatedDomainEvent);
			const roundCreatedEvent =
				emittedEvents[0] as RoundCreatedDomainEvent;
			expect(roundCreatedEvent.round.teamId).toBe("team-2");
		});

		it("throws RoundIsNotFinished if previous round is not FINISHED", () => {
			const { ctx } = createActionContext(
				{ type: "NEXT_ROUND" },
				{
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "IN_PROGRESS",
						currentWord: null,
						words: [],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			expect(() => roundFlowHandler(ctx)).toThrow(RoundIsNotFinished);
		});

		it("throws PlayerNotRoomOwnerError on NEXT_ROUND when isOnlyOwnerCanNextRound is true and actor is not owner", () => {
			const { ctx } = createActionContext(
				{ type: "NEXT_ROUND", actorId: "p1" },
				{
					settings: { isOnlyOwnerCanNextRound: true },
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "FINISHED",
						currentWord: null,
						words: [],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			expect(() => roundFlowHandler(ctx)).toThrow(
				PlayerNotRoomOwnerError,
			);
		});

		it("allows non-owner player to trigger NEXT_ROUND when isOnlyOwnerCanNextRound is false", () => {
			const { ctx } = createActionContext(
				{ type: "NEXT_ROUND", actorId: "p1" },
				{
					settings: { isOnlyOwnerCanNextRound: false },
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "FINISHED",
						currentWord: null,
						words: [],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			expect(() => roundFlowHandler(ctx)).not.toThrow();
			expect(ctx.state.currentRound?.roundNumber).toBe(2);
		});

		it("throws TeamHasNoOnlinePlayersError on NEXT_ROUND if any team has 0 online players", () => {
			const { ctx } = createActionContext(
				{ type: "NEXT_ROUND", actorId: "host-1" },
				{
					players: [
						{
							id: "p1",
							name: "Alice",
							teamId: "team-1",
							isOnline: true,
							isReady: true,
						},
						{
							id: "p2",
							name: "Bob",
							teamId: "team-1",
							isOnline: true,
							isReady: true,
						},
						{
							id: "p3",
							name: "Charlie",
							teamId: "team-2",
							isOnline: false,
							isReady: true,
						},
					],
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "FINISHED",
						currentWord: null,
						words: [],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			expect(() => roundFlowHandler(ctx)).toThrow(
				TeamHasNoOnlinePlayersError,
			);
		});

		it("skips offline players when selecting next explainer for next team", () => {
			const { ctx } = createActionContext(
				{ type: "NEXT_ROUND", actorId: "host-1" },
				{
					teams: [
						{
							id: "team-1",
							name: "Team Red",
							color: "#FF0000",
							score: 10,
						},
						{
							id: "team-2",
							name: "Team Blue",
							color: "#0000FF",
							score: 8,
							lastExplainerId: "p3",
						},
					],
					players: [
						{
							id: "p1",
							name: "Alice",
							teamId: "team-1",
							isOnline: true,
							isReady: true,
						},
						{
							id: "p3",
							name: "Charlie",
							teamId: "team-2",
							isOnline: true,
							isReady: true,
						},
						{
							id: "p4",
							name: "Dave",
							teamId: "team-2",
							isOnline: false,
							isReady: true,
						},
						{
							id: "p5",
							name: "Eve",
							teamId: "team-2",
							isOnline: true,
							isReady: true,
						},
					],
					activeTeamId: "team-1",
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "FINISHED",
						currentWord: null,
						words: [],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			roundFlowHandler(ctx);

			expect(ctx.state.currentRound?.explainerId).toBe("p5");
			expect(ctx.state.teams[1].lastExplainerId).toBe("p5");
		});

		it("skips an empty or offline team in cyclic order if at least 2 other teams have online players", () => {
			const { ctx } = createActionContext(
				{ type: "NEXT_ROUND", actorId: "host-1" },
				{
					teams: [
						{
							id: "team-1",
							name: "Team 1",
							color: "#FF0000",
							score: 0,
						},
						{
							id: "team-2",
							name: "Team 2",
							color: "#00FF00",
							score: 0,
						},
						{
							id: "team-3",
							name: "Team 3",
							color: "#0000FF",
							score: 0,
						},
					],
					players: [
						{
							id: "p1",
							name: "Alice",
							teamId: "team-1",
							isOnline: true,
							isReady: true,
						},
						// team-2 has no players at all (or all players offline)
						{
							id: "p3",
							name: "Charlie",
							teamId: "team-3",
							isOnline: true,
							isReady: true,
						},
					],
					activeTeamId: "team-1",
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "FINISHED",
						currentWord: null,
						words: [],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			roundFlowHandler(ctx);

			// Should skip team-2 and pick team-3
			expect(ctx.state.activeTeamId).toBe("team-3");
			expect(ctx.state.currentRound?.teamId).toBe("team-3");
			expect(ctx.state.currentRound?.explainerId).toBe("p3");
		});
	});

	describe("6. Owner & Settings Permission Guards", () => {
		it("throws PlayerNotRoomOwnerError on CHANGE_WORD_SCORE when isOnlyOwnerCanChangeScore is true and actor is not owner", () => {
			const { ctx } = createActionContext(
				{
					type: "CHANGE_WORD_SCORE",
					actorId: "p1",
					payload: { wordId: "w-1", delta: 1 },
				},
				{
					settings: { isOnlyOwnerCanChangeScore: true },
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "POINTING",
						currentWord: null,
						words: [{ id: "w-1", text: "GALAXY", score: 0 }],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			expect(() => roundFlowHandler(ctx)).toThrow(
				PlayerNotRoomOwnerError,
			);
		});

		it("allows non-owner to CHANGE_WORD_SCORE when isOnlyOwnerCanChangeScore is false", () => {
			const { ctx } = createActionContext(
				{
					type: "CHANGE_WORD_SCORE",
					actorId: "p1",
					payload: { wordId: "w-1", delta: 1 },
				},
				{
					settings: { isOnlyOwnerCanChangeScore: false },
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "POINTING",
						currentWord: null,
						words: [{ id: "w-1", text: "GALAXY", score: 0 }],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			expect(() => roundFlowHandler(ctx)).not.toThrow();
			expect(ctx.state.currentRound?.words[0].score).toBe(1);
		});

		it("throws PlayerNotRoomOwnerError on START_POINTING when actorId is neither owner nor 'system'", () => {
			const { ctx } = createActionContext(
				{ type: "START_POINTING", actorId: "p1" },
				{
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "IN_PROGRESS",
						currentWord: null,
						words: [],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			expect(() => roundFlowHandler(ctx)).toThrow(
				PlayerNotRoomOwnerError,
			);
		});

		it("throws PlayerNotRoomOwnerError on END_POINTING when actorId is neither owner nor 'system'", () => {
			const { ctx } = createActionContext(
				{ type: "END_POINTING", actorId: "p1" },
				{
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "POINTING",
						currentWord: null,
						words: [],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			expect(() => roundFlowHandler(ctx)).toThrow(
				PlayerNotRoomOwnerError,
			);
		});

		it("throws PlayerNotRoomOwnerError on CHANGE_ROUND_TIME when actorId is not owner", () => {
			const { ctx } = createActionContext(
				{
					type: "CHANGE_ROUND_TIME",
					actorId: "p1",
					payload: { expiresAt: 5000 },
				},
				{
					currentRound: {
						id: "r-1",
						explainerId: "p1",
						teamId: "team-1",
						status: "IN_PROGRESS",
						currentWord: null,
						words: [],
						roundNumber: 1,
						expiresAt: 100,
					},
				},
			);

			expect(() => roundFlowHandler(ctx)).toThrow(
				PlayerNotRoomOwnerError,
			);
		});
	});
});
