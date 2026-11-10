import type { DomainEvent } from "@common/domain/domain-event";
import type { GameAction } from "../../actions/game.actions";
import {
	GameNotInLobbyError,
	PlayerNotFoundError,
	PlayerNotRoomOwnerError,
	TeamNameExistsError,
} from "../../errors/game.errors";
import {
	PlayerKickedDomainEvent,
	PlayerReadyToggledDomainEvent,
	TeamCreatedDomainEvent,
} from "../../events/game.events";
import type { GameState } from "../../state/game.state";
import type { ActionContext } from "../pipeline.types";
import { lobbyHandler } from "./lobby.handler";

describe("lobbyHandler", () => {
	const createInitialState = (overrides?: Partial<GameState>): GameState => ({
		id: "room-1",
		ownerId: "p1",
		status: "LOBBY",
		pointsToWin: 50,
		teams: [
			{ id: "team-1", name: "Red Team", color: "#FF0000", score: 0 },
			{ id: "team-2", name: "Blue Team", color: "#0000FF", score: 0 },
		],
		players: [
			{ id: "p1", name: "Alice", teamId: "team-1", isReady: false },
			{ id: "p2", name: "Bob", teamId: "team-1", isReady: false },
			{ id: "p3", name: "Charlie", teamId: "team-2", isReady: false },
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
			state: createInitialState(stateOverrides),
			emit: (event) => emittedEvents.push(event),
		};
		return { ctx, emittedEvents };
	};

	describe("1. ADD_TEAM", () => {
		it("adds a new team to state and emits TeamCreatedDomainEvent", () => {
			const { ctx, emittedEvents } = createActionContext({
				type: "ADD_TEAM",
				payload: {
					teamId: "team-3",
					name: "Green Team",
					color: "#00FF00",
				},
			});

			lobbyHandler(ctx);

			expect(ctx.state.teams).toHaveLength(3);
			expect(ctx.state.teams[2]).toEqual({
				id: "team-3",
				name: "Green Team",
				color: "#00FF00",
				score: 0,
			});

			expect(emittedEvents).toHaveLength(1);
			const teamEvent = emittedEvents[0] as TeamCreatedDomainEvent;
			expect(teamEvent).toBeInstanceOf(TeamCreatedDomainEvent);
			expect(teamEvent.team.name).toBe("Green Team");
		});

		it("allows owner to add team during IN_PROGRESS", () => {
			const { ctx, emittedEvents } = createActionContext(
				{
					type: "ADD_TEAM",
					actorId: "owner-1",
					payload: {
						teamId: "team-3",
						name: "Green Team",
						color: "#00FF00",
					},
				},
				{ status: "IN_PROGRESS", ownerId: "owner-1" },
			);

			lobbyHandler(ctx);

			expect(ctx.state.teams).toHaveLength(3);
			expect(emittedEvents).toHaveLength(1);
		});

		it("throws GameNotInLobbyError if game is in FINISHED status", () => {
			const { ctx } = createActionContext(
				{
					type: "ADD_TEAM",
					actorId: "owner-1",
					payload: {
						teamId: "team-3",
						name: "Green Team",
						color: "#00FF00",
					},
				},
				{ status: "FINISHED", ownerId: "owner-1" },
			);

			expect(() => lobbyHandler(ctx)).toThrow(GameNotInLobbyError);
		});

		it("throws PlayerNotRoomOwnerError if non-owner tries to add team during game", () => {
			const { ctx } = createActionContext(
				{
					type: "ADD_TEAM",
					actorId: "non-owner",
					payload: {
						teamId: "team-3",
						name: "Green Team",
						color: "#00FF00",
					},
				},
				{ status: "IN_PROGRESS", ownerId: "owner-1" },
			);

			expect(() => lobbyHandler(ctx)).toThrow(PlayerNotRoomOwnerError);
		});

		it("throws TeamNameExistsError if team name is already taken", () => {
			const { ctx } = createActionContext({
				type: "ADD_TEAM",
				payload: {
					teamId: "team-3",
					name: "red team",
					color: "#00FF00",
				},
			});

			expect(() => lobbyHandler(ctx)).toThrow(TeamNameExistsError);
		});
	});

	describe("2. TOGGLE_READY", () => {
		it("toggles player ready state and emits PlayerReadyToggledDomainEvent", () => {
			const { ctx, emittedEvents } = createActionContext({
				type: "TOGGLE_READY",
				payload: { playerId: "p1" },
			});

			lobbyHandler(ctx);

			const player = ctx.state.players.find((p) => p.id === "p1")!;
			expect(player.isReady).toBe(true);

			expect(emittedEvents).toHaveLength(1);
			const readyEvent =
				emittedEvents[0] as PlayerReadyToggledDomainEvent;
			expect(readyEvent).toBeInstanceOf(PlayerReadyToggledDomainEvent);
			expect(readyEvent.isReady).toBe(true);
		});

		it("throws PlayerNotFoundError if player does not exist", () => {
			const { ctx } = createActionContext({
				type: "TOGGLE_READY",
				payload: { playerId: "unknown-player" },
			});

			expect(() => lobbyHandler(ctx)).toThrow(PlayerNotFoundError);
		});

		it("throws GameNotInLobbyError if game is not in LOBBY status", () => {
			const { ctx } = createActionContext(
				{
					type: "TOGGLE_READY",
					payload: { playerId: "p1" },
				},
				{ status: "IN_PROGRESS" },
			);

			expect(() => lobbyHandler(ctx)).toThrow(GameNotInLobbyError);
		});
	});

	describe("3. KICK_PLAYER", () => {
		it("removes player from room and teams and emits PlayerKickedDomainEvent", () => {
			const { ctx, emittedEvents } = createActionContext({
				type: "KICK_PLAYER",
				actorId: "p1",
				payload: { targetPlayerId: "p3", isPermanent: false },
			});

			lobbyHandler(ctx);

			expect(ctx.state.players.some((p) => p.id === "p3")).toBe(false);
			expect(ctx.state.bannedPlayerIds).toHaveLength(0);

			expect(emittedEvents).toHaveLength(1);
			const kickEvent = emittedEvents[0] as PlayerKickedDomainEvent;
			expect(kickEvent).toBeInstanceOf(PlayerKickedDomainEvent);
			expect(kickEvent.targetPlayerId).toBe("p3");
			expect(kickEvent.isPermanent).toBe(false);
		});

		it("adds player to bannedPlayerIds when kick is permanent", () => {
			const { ctx } = createActionContext({
				type: "KICK_PLAYER",
				actorId: "p1",
				payload: { targetPlayerId: "p3", isPermanent: true },
			});

			lobbyHandler(ctx);

			expect(ctx.state.bannedPlayerIds).toContain("p3");
		});

		it("throws PlayerNotRoomOwnerError if a non-owner attempts to kick", () => {
			const { ctx } = createActionContext({
				type: "KICK_PLAYER",
				actorId: "p2",
				payload: { targetPlayerId: "p3" },
			});

			expect(() => lobbyHandler(ctx)).toThrow(PlayerNotRoomOwnerError);
		});
	});
});
