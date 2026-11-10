import type { DomainEvent } from "@common/domain/domain-event";
import type { GameAction } from "../../actions/game.actions";
import {
	GameNotInLobbyError,
	GameNotInProgressError,
	NotEnoughTeamsError,
	PlayerNotRoomOwnerError,
	PlayersNotReadyError,
} from "../../errors/game.errors";
import { TeamIsEmptyError } from "../../errors/team.errors";
import {
	GameFinishedDomainEvent,
	GameStartedDomainEvent,
} from "../../events/game.events";
import type { GameState } from "../../state/game.state";
import type { ActionContext } from "../pipeline.types";
import { gameLifecycleHandler } from "./game-lifecycle.handler";

jest.mock("uuid", () => ({
	v4: () => "mocked-game-round-uuid",
}));

describe("gameLifecycleHandler", () => {
	const createInitialLobbyState = (
		overrides?: Partial<GameState>,
	): GameState => ({
		id: "room-1",
		ownerId: "host-1",
		status: "LOBBY",
		pointsToWin: 30,
		teams: [
			{ id: "team-1", name: "Red", color: "#FF0000", score: 0 },
			{ id: "team-2", name: "Blue", color: "#0000FF", score: 0 },
		],
		players: [
			{ id: "p1", name: "Alice", teamId: "team-1", isReady: true },
			{ id: "p2", name: "Bob", teamId: "team-2", isReady: true },
		],
		bannedPlayerIds: [],
		activeTeamId: null,
		currentRound: null,
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
			state: createInitialLobbyState(stateOverrides),
			emit: (event) => emittedEvents.push(event),
		};
		return { ctx, emittedEvents };
	};

	describe("1. START_GAME", () => {
		it("successfully transitions from LOBBY to IN_PROGRESS, creates first round, and emits GameStartedDomainEvent", () => {
			const { ctx, emittedEvents } = createActionContext({
				type: "START_GAME",
				actorId: "host-1",
			});

			gameLifecycleHandler(ctx);

			expect(ctx.state.status).toBe("IN_PROGRESS");
			expect(ctx.state.activeTeamId).toBe("team-1");

			const round = ctx.state.currentRound!;
			expect(round).toBeDefined();
			expect(round.id).toBe("mocked-game-round-uuid");
			expect(round.roundNumber).toBe(1);
			expect(round.teamId).toBe("team-1");
			expect(round.explainerId).toBe("p1");
			expect(round.status).toBe("PENDING");
			expect(round.words).toEqual([]);
			expect(round.currentWord).toBeNull();

			expect(emittedEvents).toHaveLength(1);
			const startEvent = emittedEvents[0] as GameStartedDomainEvent;
			expect(startEvent).toBeInstanceOf(GameStartedDomainEvent);
			expect(startEvent.initialRound.teamId).toBe("team-1");
		});

		it("throws GameNotInLobbyError if game is not in LOBBY status", () => {
			const { ctx } = createActionContext(
				{ type: "START_GAME", actorId: "host-1" },
				{ status: "IN_PROGRESS" },
			);

			expect(() => gameLifecycleHandler(ctx)).toThrow(
				GameNotInLobbyError,
			);
		});

		it("throws PlayerNotRoomOwnerError if actor is not the room owner", () => {
			const { ctx } = createActionContext({
				type: "START_GAME",
				actorId: "random-player",
			});

			expect(() => gameLifecycleHandler(ctx)).toThrow(
				PlayerNotRoomOwnerError,
			);
		});

		it("throws NotEnoughTeamsError if there are less than 2 teams", () => {
			const { ctx } = createActionContext(
				{ type: "START_GAME", actorId: "host-1" },
				{
					teams: [
						{
							id: "team-1",
							name: "Solo",
							color: "#FF0000",
							score: 0,
						},
					],
				},
			);

			expect(() => gameLifecycleHandler(ctx)).toThrow(
				NotEnoughTeamsError,
			);
		});

		it("throws TeamIsEmptyError if any team has no players", () => {
			const { ctx } = createActionContext(
				{ type: "START_GAME", actorId: "host-1" },
				{
					players: [
						{
							id: "p1",
							name: "Alice",
							teamId: "team-1",
							isReady: true,
						},
					],
				},
			);

			expect(() => gameLifecycleHandler(ctx)).toThrow(TeamIsEmptyError);
		});

		it("throws PlayersNotReadyError if any team player is not ready", () => {
			const { ctx } = createActionContext(
				{ type: "START_GAME", actorId: "host-1" },
				{
					players: [
						{
							id: "p1",
							name: "Alice",
							teamId: "team-1",
							isReady: true,
						},
						{
							id: "p2",
							name: "Bob",
							teamId: "team-2",
							isReady: false,
						},
					],
				},
			);

			expect(() => gameLifecycleHandler(ctx)).toThrow(
				PlayersNotReadyError,
			);
		});
	});

	describe("2. END_GAME", () => {
		it("successfully finishes the game, computes winner team, and emits GameFinishedDomainEvent", () => {
			const { ctx, emittedEvents } = createActionContext(
				{ type: "END_GAME", actorId: "host-1" },
				{
					status: "IN_PROGRESS",
					teams: [
						{
							id: "team-1",
							name: "Red",
							color: "#FF0000",
							score: 15,
						},
						{
							id: "team-2",
							name: "Blue",
							color: "#0000FF",
							score: 25,
						},
					],
					currentRound: {
						id: "r-active",
						explainerId: "p1",
						teamId: "team-1",
						status: "IN_PROGRESS",
						currentWord: null,
						words: [],
						roundNumber: 3,
						endTime: 100,
					},
				},
			);

			gameLifecycleHandler(ctx);

			expect(ctx.state.status).toBe("FINISHED");
			expect(ctx.state.winnerTeamId).toBe("team-2");
			expect(ctx.state.currentRound).toBeNull();

			expect(emittedEvents).toHaveLength(1);
			const finishEvent = emittedEvents[0] as GameFinishedDomainEvent;
			expect(finishEvent).toBeInstanceOf(GameFinishedDomainEvent);
			expect(finishEvent.winnerTeamId).toBe("team-2");
		});

		it("throws PlayerNotRoomOwnerError if actor is not the room owner", () => {
			const { ctx } = createActionContext(
				{ type: "END_GAME", actorId: "intruder" },
				{ status: "IN_PROGRESS" },
			);

			expect(() => gameLifecycleHandler(ctx)).toThrow(
				PlayerNotRoomOwnerError,
			);
		});

		it("throws GameNotInProgressError if game is not IN_PROGRESS", () => {
			const { ctx } = createActionContext({
				type: "END_GAME",
				actorId: "host-1",
			});

			expect(() => gameLifecycleHandler(ctx)).toThrow(
				GameNotInProgressError,
			);
		});
	});
});
