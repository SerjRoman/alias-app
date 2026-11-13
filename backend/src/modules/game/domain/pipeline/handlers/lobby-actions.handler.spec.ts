import { GameEngine } from "../../engine/game-engine";
import {
	GameNotFinishedError,
	GameNotInLobbyError,
	InvalidSubmittedWordsCountError,
	NotEnoughTeamsError,
	NotRoomOwnerOnlyDuringGameError,
	PlayerNotFoundError,
	PlayerNotRoomOwnerError,
	PlayerPermanentlyKickedError,
} from "../../errors/game.errors";
import {
	RoundIsNotInProgress,
	RoundIsNotPending,
} from "../../errors/round.errors";
import {
	ExplainerCannotBeMovedError,
	TeamError,
	TeamIsPlayingError,
	TeamNotFoundError,
} from "../../errors/team.errors";
import {
	OWNER_OFFLINE_TIMEOUT_MS,
	RoundStatus,
	type GameState,
} from "../../state/game.state";

let uuidSeq = 0;
jest.mock("uuid", () => ({
	v4: () => `action-uuid-${++uuidSeq}`,
}));

describe("Lobby, Team & Moderation Actions Pipeline Suite", () => {
	const ownerId = "owner-1";

	const createLobbyEngine = (overrides?: Partial<GameState>): GameEngine => {
		return GameEngine.fromPrimitives({
			id: "room-1",
			ownerId,
			status: "LOBBY",
			pointsToWin: 30,
			roundTimeSeconds: 60,
			settings: {
				name: "Test Room",
				roundTimeSeconds: 60,
				pointsToWin: 30,
				code: "123456",
				isPrivate: false,
				wordPackSelections: [],
				wordsPerPlayer: 0,
				isHatMode: false,
				isOnlyOwnerCanNextRound: true,
				isOnlyOwnerCanChangeScore: true,
				isVoiceChatEnabled: true,
			},
			teams: [
				{
					id: "team-1",
					name: "Alpha",
					score: 0,
					playerIds: ["owner-1", "p2"],
				},
				{
					id: "team-2",
					name: "Beta",
					score: 0,
					playerIds: ["p3"],
				},
			],
			players: [
				{
					id: ownerId,
					name: "Owner",
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
					isOnline: true,
				},
			],
			spectators: [],
			bannedPlayerIds: [],
			activeTeamId: null,
			currentRound: null,
			activeEffects: [],
			addons: {},
			...overrides,
		});
	};

	describe("Lobby & Player Management (JOIN_GAME, LEAVE_GAME, SET_PLAYER_OFFLINE)", () => {
		it("JOIN_GAME adds a new player to players and spectators", () => {
			const engine = createLobbyEngine();

			engine.dispatch({
				type: "JOIN_GAME",
				actorId: "p4",
				payload: {
					playerId: "p4",
					name: "Diana",
					role: "registered",
				},
			});

			const state = engine.toPrimitives();
			const diana = state.players.find((p) => p.id === "p4");
			expect(diana).toBeDefined();
			expect(diana?.name).toBe("Diana");
			expect(diana?.role).toBe("registered");
			expect(diana?.isOnline).toBe(true);
			expect(state.spectators).toContain("p4");
		});

		it("JOIN_GAME marks an existing offline player as online without duplicating", () => {
			const engine = createLobbyEngine();
			engine.dispatch({
				type: "SET_PLAYER_OFFLINE",
				actorId: "p2",
				payload: { playerId: "p2" },
			});
			expect(
				engine.getState().players.find((p) => p.id === "p2")?.isOnline,
			).toBe(false);

			engine.dispatch({
				type: "JOIN_GAME",
				actorId: "p2",
				payload: { playerId: "p2", name: "Bob", role: "registered" },
			});

			expect(engine.getState().players).toHaveLength(3);
			expect(
				engine.getState().players.find((p) => p.id === "p2")?.isOnline,
			).toBe(true);
		});

		it("JOIN_GAME throws PlayerPermanentlyKickedError if player is banned", () => {
			const engine = createLobbyEngine({ bannedPlayerIds: ["banned-1"] });

			expect(() =>
				engine.dispatch({
					type: "JOIN_GAME",
					actorId: "banned-1",
					payload: { playerId: "banned-1", name: "BadActor" },
				}),
			).toThrow(PlayerPermanentlyKickedError);
		});

		it("LEAVE_GAME removes player from players, teams, and spectators", () => {
			const engine = createLobbyEngine();

			engine.dispatch({
				type: "LEAVE_GAME",
				actorId: "p2",
				payload: { playerId: "p2" },
			});

			const state = engine.toPrimitives();
			expect(state.players.some((p) => p.id === "p2")).toBe(false);
			expect(state.teams[0].playerIds).not.toContain("p2");
		});
	});

	describe("Settings & Custom Words (UPDATE_SETTINGS, SUBMIT_CUSTOM_WORDS)", () => {
		it("UPDATE_SETTINGS updates settings and resets submittedWordsCount when hat mode changes", () => {
			const engine = createLobbyEngine({
				settings: {
					name: "Room",
					roundTimeSeconds: 60,
					pointsToWin: 30,
					code: null,
					isPrivate: false,
					wordPackSelections: [],
					isHatMode: true,
					wordsPerPlayer: 3,
					isOnlyOwnerCanNextRound: true,
					isOnlyOwnerCanChangeScore: true,
					isVoiceChatEnabled: true,
				},
			});

			engine.dispatch({
				type: "SUBMIT_CUSTOM_WORDS",
				actorId: "p2",
				payload: { wordsCount: 3 },
			});
			expect(
				engine.getState().players.find((p) => p.id === "p2")
					?.submittedWordsCount,
			).toBe(3);

			engine.dispatch({
				type: "UPDATE_SETTINGS",
				actorId: ownerId,
				payload: {
					pointsToWin: 45,
					wordsPerPlayer: 5,
				},
			});

			const state = engine.toPrimitives();
			expect(state.settings?.pointsToWin).toBe(45);
			expect(state.pointsToWin).toBe(45);
			expect(
				state.players.find((p) => p.id === "p2")?.submittedWordsCount,
			).toBe(0);
		});

		it("SUBMIT_CUSTOM_WORDS throws InvalidSubmittedWordsCountError if word count does not match wordsPerPlayer", () => {
			const engine = createLobbyEngine({
				settings: {
					name: "Room",
					roundTimeSeconds: 60,
					pointsToWin: 30,
					code: null,
					isPrivate: false,
					wordPackSelections: [],
					isHatMode: true,
					wordsPerPlayer: 4,
					isOnlyOwnerCanNextRound: true,
					isOnlyOwnerCanChangeScore: true,
					isVoiceChatEnabled: true,
				},
			});

			expect(() =>
				engine.dispatch({
					type: "SUBMIT_CUSTOM_WORDS",
					actorId: "p2",
					payload: { wordsCount: 2 },
				}),
			).toThrow(InvalidSubmittedWordsCountError);
		});
	});

	describe("Team Management (DELETE_TEAM, MOVE_TO_TEAM, MOVE_TO_SPECTATORS, SHUFFLE_PLAYERS)", () => {
		it("MOVE_TO_SPECTATORS removes player from team, adds to spectators, and resets ready flags", () => {
			const engine = createLobbyEngine();

			engine.dispatch({
				type: "MOVE_TO_SPECTATORS",
				actorId: "p2",
				payload: { playerId: "p2" },
			});

			const state = engine.toPrimitives();
			const p2 = state.players.find((p) => p.id === "p2");
			expect(p2?.teamId).toBeUndefined();
			expect(p2?.isReady).toBe(false);
			expect(state.teams[0].playerIds).not.toContain("p2");
			expect(state.spectators).toContain("p2");
		});

		it("MOVE_TO_TEAM moves player from spectators or another team to targetTeam", () => {
			const engine = createLobbyEngine();

			engine.dispatch({
				type: "MOVE_TO_TEAM",
				actorId: "p2",
				payload: { playerId: "p2", teamId: "team-2" },
			});

			const state = engine.toPrimitives();
			expect(state.teams[0].playerIds).not.toContain("p2");
			expect(state.teams[1].playerIds).toContain("p2");
			expect(state.players.find((p) => p.id === "p2")?.teamId).toBe(
				"team-2",
			);
		});

		it("DELETE_TEAM removes the team in LOBBY for room owner", () => {
			const engine = createLobbyEngine();

			engine.dispatch({
				type: "DELETE_TEAM",
				actorId: ownerId,
				payload: { teamId: "team-2" },
			});

			const state = engine.toPrimitives();
			expect(state.teams).toHaveLength(1);
			expect(state.teams[0].id).toBe("team-1");
			expect(
				state.players.find((p) => p.id === "p3")?.teamId,
			).toBeUndefined();
		});

		it("DELETE_TEAM throws TeamNotFoundError for unknown team", () => {
			const engine = createLobbyEngine();
			expect(() =>
				engine.dispatch({
					type: "DELETE_TEAM",
					actorId: ownerId,
					payload: { teamId: "non-existent" },
				}),
			).toThrow(TeamNotFoundError);
		});

		it("SHUFFLE_PLAYERS distributes all players across existing teams", () => {
			const engine = createLobbyEngine();

			engine.dispatch({
				type: "SHUFFLE_PLAYERS",
				actorId: ownerId,
			});

			const state = engine.toPrimitives();
			const totalAssigned = state.teams.reduce(
				(acc, t) => acc + (t.playerIds?.length ?? 0),
				0,
			);
			expect(totalAssigned).toBe(3);
		});

		it("SHUFFLE_PLAYERS throws TeamError when there are 0 teams", () => {
			const engine = createLobbyEngine({ teams: [] });
			expect(() =>
				engine.dispatch({
					type: "SHUFFLE_PLAYERS",
					actorId: ownerId,
				}),
			).toThrow(TeamError);
		});
	});

	describe("In-Game Team and Player Management (Step 3: Mid-game changes)", () => {
		const createInProgressEngine = (
			overrides?: Partial<GameState>,
		): GameEngine => {
			return GameEngine.fromPrimitives({
				id: "room-midgame",
				ownerId,
				status: "IN_PROGRESS",
				pointsToWin: 30,
				activeTeamId: "team-1",
				teams: [
					{
						id: "team-1",
						name: "Alpha",
						score: 5,
						playerIds: [ownerId],
					},
					{
						id: "team-2",
						name: "Beta",
						score: 3,
						playerIds: ["p2"],
					},
					{
						id: "team-3",
						name: "Gamma",
						score: 0,
						playerIds: ["p3"],
					},
				],
				players: [
					{
						id: ownerId,
						name: "Owner",
						teamId: "team-1",
						isReady: true,
						isOnline: true,
					},
					{
						id: "p2",
						name: "Player 2",
						teamId: "team-2",
						isReady: true,
						isOnline: true,
					},
					{
						id: "p3",
						name: "Player 3",
						teamId: "team-3",
						isReady: true,
						isOnline: true,
					},
					{
						id: "p4",
						name: "Spectator",
						isReady: false,
						isOnline: true,
					},
				],
				spectators: ["p4"],
				currentRound: {
					id: "round-1",
					teamId: "team-1",
					explainerId: ownerId,
					roundNumber: 1,
					status: RoundStatus.IN_PROGRESS,
					words: [],
					currentWord: null,
					expiresAt: 10000,
				},
				activeEffects: [],
				addons: {},
				bannedPlayerIds: [],
				...overrides,
			});
		};

		it("allows room owner to delete a team during IN_PROGRESS when more than 2 teams exist, moving its players to spectators", () => {
			const engine = createInProgressEngine();

			engine.dispatch({
				type: "DELETE_TEAM",
				actorId: ownerId,
				payload: { teamId: "team-3" },
			});

			const state = engine.toPrimitives();
			expect(state.teams).toHaveLength(2);
			expect(state.teams.some((t) => t.id === "team-3")).toBe(false);
			const p3 = state.players.find((p) => p.id === "p3");
			expect(p3?.teamId).toBeUndefined();
			expect(state.spectators).toContain("p3");
		});

		it("DELETE_TEAM during IN_PROGRESS throws NotEnoughTeamsError if remaining teams would be less than 2", () => {
			const engine = createInProgressEngine({
				teams: [
					{
						id: "team-1",
						name: "Alpha",
						score: 0,
						playerIds: [ownerId],
					},
					{ id: "team-2", name: "Beta", score: 0, playerIds: ["p2"] },
				],
			});

			expect(() =>
				engine.dispatch({
					type: "DELETE_TEAM",
					actorId: ownerId,
					payload: { teamId: "team-2" },
				}),
			).toThrow(NotEnoughTeamsError);
		});

		it("DELETE_TEAM during IN_PROGRESS throws TeamIsPlayingError if deleting currently active round team", () => {
			const engine = createInProgressEngine();

			expect(() =>
				engine.dispatch({
					type: "DELETE_TEAM",
					actorId: ownerId,
					payload: { teamId: "team-1" },
				}),
			).toThrow(TeamIsPlayingError);
		});

		it("DELETE_TEAM during IN_PROGRESS throws PlayerNotRoomOwnerError if non-owner attempts deletion", () => {
			const engine = createInProgressEngine();

			expect(() =>
				engine.dispatch({
					type: "DELETE_TEAM",
					actorId: "p2",
					payload: { teamId: "team-3" },
				}),
			).toThrow(PlayerNotRoomOwnerError);
		});

		it("allows room owner to MOVE_TO_TEAM during IN_PROGRESS, moving a spectator into a team", () => {
			const engine = createInProgressEngine();

			engine.dispatch({
				type: "MOVE_TO_TEAM",
				actorId: ownerId,
				payload: { playerId: "p4", teamId: "team-2" },
			});

			const state = engine.toPrimitives();
			expect(state.spectators).not.toContain("p4");
			expect(
				state.teams.find((t) => t.id === "team-2")?.playerIds,
			).toContain("p4");
			expect(state.players.find((p) => p.id === "p4")?.teamId).toBe(
				"team-2",
			);
		});

		it("MOVE_TO_TEAM during IN_PROGRESS throws NotRoomOwnerOnlyDuringGameError if non-owner attempts it", () => {
			const engine = createInProgressEngine();

			expect(() =>
				engine.dispatch({
					type: "MOVE_TO_TEAM",
					actorId: "p4",
					payload: { playerId: "p4", teamId: "team-2" },
				}),
			).toThrow(NotRoomOwnerOnlyDuringGameError);
		});

		it("MOVE_TO_TEAM during IN_PROGRESS throws ExplainerCannotBeMovedError if player is currently explaining", () => {
			const engine = createInProgressEngine();

			expect(() =>
				engine.dispatch({
					type: "MOVE_TO_TEAM",
					actorId: ownerId,
					payload: { playerId: ownerId, teamId: "team-2" },
				}),
			).toThrow(ExplainerCannotBeMovedError);
		});

		it("MOVE_TO_SPECTATORS during IN_PROGRESS throws ExplainerCannotBeMovedError if player is currently explaining", () => {
			const engine = createInProgressEngine();

			expect(() =>
				engine.dispatch({
					type: "MOVE_TO_SPECTATORS",
					actorId: ownerId,
					payload: { playerId: ownerId },
				}),
			).toThrow(ExplainerCannotBeMovedError);
		});

		it("allows room owner to MOVE_TO_SPECTATORS during IN_PROGRESS", () => {
			const engine = createInProgressEngine();

			engine.dispatch({
				type: "MOVE_TO_SPECTATORS",
				actorId: ownerId,
				payload: { playerId: "p3" },
			});

			const state = engine.toPrimitives();
			expect(state.spectators).toContain("p3");
			expect(
				state.teams.find((t) => t.id === "team-3")?.playerIds,
			).not.toContain("p3");
			expect(
				state.players.find((p) => p.id === "p3")?.teamId,
			).toBeUndefined();
		});

		it("MOVE_TO_SPECTATORS during IN_PROGRESS throws NotRoomOwnerOnlyDuringGameError if non-owner attempts it", () => {
			const engine = createInProgressEngine();

			expect(() =>
				engine.dispatch({
					type: "MOVE_TO_SPECTATORS",
					actorId: "p3",
					payload: { playerId: "p3" },
				}),
			).toThrow(NotRoomOwnerOnlyDuringGameError);
		});

		it("KICK_PLAYER during IN_PROGRESS preserves player snapshot in leftPlayers", () => {
			const engine = createInProgressEngine();

			engine.dispatch({
				type: "KICK_PLAYER",
				actorId: ownerId,
				payload: { targetPlayerId: "p3" },
			});

			const state = engine.toPrimitives();
			expect(state.players.some((p) => p.id === "p3")).toBe(false);
			expect(state.leftPlayers).toHaveLength(1);
			expect(state.leftPlayers?.[0]).toEqual(
				expect.objectContaining({
					id: "p3",
					name: "Player 3",
					teamId: "team-3",
				}),
			);
		});
	});

	describe("Mid-Game Leave, Offline & Reconnect Flow (Step 4)", () => {
		const now = 100000;

		const createMidGameEngine = (
			overrides?: Partial<GameState>,
		): GameEngine => {
			return GameEngine.fromPrimitives({
				id: "room-midgame-step4",
				ownerId,
				status: "IN_PROGRESS",
				pointsToWin: 30,
				activeTeamId: "team-1",
				teams: [
					{
						id: "team-1",
						name: "Alpha",
						score: 5,
						playerIds: ["p1", "p2"],
						lastExplainerId: "p1",
					},
					{
						id: "team-2",
						name: "Beta",
						score: 3,
						playerIds: ["p3"],
						lastExplainerId: "p3",
					},
				],
				players: [
					{
						id: ownerId,
						name: "Host",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: true,
						score: 2,
					},
					{
						id: "p1",
						name: "Explainer Alice",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: true,
						score: 3,
					},
					{
						id: "p2",
						name: "Guesser Bob",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: true,
						score: 0,
					},
					{
						id: "p3",
						name: "Charlie",
						role: "registered",
						teamId: "team-2",
						isReady: true,
						isOnline: true,
						score: 3,
					},
					{
						id: "p4",
						name: "Diana Spectator",
						role: "registered",
						isReady: false,
						isOnline: true,
						score: 0,
					},
				],
				spectators: ["p4"],
				currentRound: {
					id: "round-1",
					teamId: "team-1",
					explainerId: "p1",
					roundNumber: 1,
					status: RoundStatus.IN_PROGRESS,
					words: [],
					currentWord: { id: "w-1", text: "FOREST", score: 1 },
					expiresAt: now + 35000,
					pausedAt: null,
					remainingMs: null,
				},
				activeEffects: [],
				addons: {},
				bannedPlayerIds: [],
				...overrides,
			});
		};

		it("SET_PLAYER_OFFLINE for current explainer pauses round and sets remainingMs", () => {
			const engine = createMidGameEngine();

			engine.dispatch(
				{
					type: "SET_PLAYER_OFFLINE",
					actorId: "p1",
					payload: { playerId: "p1" },
				},
				now,
			);

			const state = engine.toPrimitives();
			expect(state.players.find((p) => p.id === "p1")?.isOnline).toBe(
				false,
			);
			expect(state.currentRound?.pausedAt).toBe(now);
			expect(state.currentRound?.remainingMs).toBe(35000);
		});

		it("SET_PLAYER_OFFLINE for room owner sets ownerOfflineSince", () => {
			const engine = createMidGameEngine();

			engine.dispatch(
				{
					type: "SET_PLAYER_OFFLINE",
					actorId: ownerId,
					payload: { playerId: ownerId },
				},
				now,
			);

			const state = engine.toPrimitives();
			expect(state.ownerOfflineSince).toBe(now);
		});

		it("JOIN_GAME resumes paused round when paused explainer reconnects", () => {
			const engine = createMidGameEngine({
				players: [
					{
						id: "owner-1",
						name: "Host",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: true,
					},
					{
						id: "p1",
						name: "Explainer Alice",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: false,
					},
					{
						id: "p2",
						name: "Guesser Bob",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: true,
					},
					{
						id: "p3",
						name: "Charlie",
						role: "registered",
						teamId: "team-2",
						isReady: true,
						isOnline: true,
					},
				],
				currentRound: {
					id: "round-1",
					teamId: "team-1",
					explainerId: "p1",
					roundNumber: 1,
					status: RoundStatus.IN_PROGRESS,
					words: [],
					currentWord: { id: "w-1", text: "FOREST", score: 1 },
					expiresAt: now + 35000,
					pausedAt: now - 5000,
					remainingMs: 35000,
				},
			});

			const reconnectTime = now + 10000;
			engine.dispatch(
				{
					type: "JOIN_GAME",
					actorId: "p1",
					payload: {
						playerId: "p1",
						name: "Explainer Alice",
						role: "registered",
					},
				},
				reconnectTime,
			);

			const state = engine.toPrimitives();
			const explainer = state.players.find((p) => p.id === "p1");
			expect(explainer?.isOnline).toBe(true);
			expect(state.currentRound?.pausedAt).toBeNull();
			expect(state.currentRound?.remainingMs).toBeNull();
			expect(state.currentRound?.expiresAt).toBe(reconnectTime + 35000);
		});

		it("JOIN_GAME clears ownerOfflineSince when owner reconnects", () => {
			const engine = createMidGameEngine({
				ownerOfflineSince: now - 20000,
				players: [
					{
						id: ownerId,
						name: "Host",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: false,
					},
					{
						id: "p1",
						name: "Explainer Alice",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: true,
					},
				],
			});

			engine.dispatch(
				{
					type: "JOIN_GAME",
					actorId: ownerId,
					payload: {
						playerId: ownerId,
						name: "Host",
						role: "registered",
					},
				},
				now,
			);

			const state = engine.toPrimitives();
			expect(state.ownerOfflineSince).toBeNull();
		});

		it("LEAVE_GAME during IN_PROGRESS saves snapshot to leftPlayers and removes player", () => {
			const engine = createMidGameEngine();

			engine.dispatch(
				{
					type: "LEAVE_GAME",
					actorId: "p2",
					payload: { playerId: "p2" },
				},
				now,
			);

			const state = engine.toPrimitives();
			expect(state.players.some((p) => p.id === "p2")).toBe(false);
			expect(state.teams[0].playerIds).not.toContain("p2");
			expect(state.leftPlayers).toContainEqual(
				expect.objectContaining({
					id: "p2",
					name: "Guesser Bob",
					teamId: "team-1",
					score: 0,
					leftAt: now,
				}),
			);
		});

		it("LEAVE_GAME for current explainer pauses round", () => {
			const engine = createMidGameEngine();

			engine.dispatch(
				{
					type: "LEAVE_GAME",
					actorId: "p1",
					payload: { playerId: "p1" },
				},
				now,
			);

			const state = engine.toPrimitives();
			expect(state.players.some((p) => p.id === "p1")).toBe(false);
			expect(state.currentRound?.pausedAt).toBe(now);
			expect(state.currentRound?.remainingMs).toBe(35000);
		});

		it("LEAVE_GAME for owner immediately transfers ownership to first online team player", () => {
			const engine = createMidGameEngine();

			engine.dispatch(
				{
					type: "LEAVE_GAME",
					actorId: ownerId,
					payload: { playerId: ownerId },
				},
				now,
			);

			const state = engine.toPrimitives();
			expect(state.ownerId).toBe("p1"); // p1 is the next online player in team
			expect(state.players.some((p) => p.id === ownerId)).toBe(false);
		});

		it("LEAVE_GAME for owner falls back to online spectator if no team players remain", () => {
			const engine = createMidGameEngine({
				players: [
					{
						id: ownerId,
						name: "Host",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: true,
					},
					{
						id: "p4",
						name: "Spectator",
						role: "registered",
						isReady: false,
						isOnline: true,
					},
				],
				teams: [
					{
						id: "team-1",
						name: "Alpha",
						score: 0,
						playerIds: [ownerId],
					},
				],
				spectators: ["p4"],
			});

			engine.dispatch(
				{
					type: "LEAVE_GAME",
					actorId: ownerId,
					payload: { playerId: ownerId },
				},
				now,
			);

			const state = engine.toPrimitives();
			expect(state.ownerId).toBe("p4");
		});

		it("LEAVE_GAME finishes active round immediately if active playing team becomes completely empty", () => {
			const engine = createMidGameEngine({
				teams: [
					{
						id: "team-1",
						name: "Alpha",
						score: 5,
						playerIds: ["p1"],
					},
					{ id: "team-2", name: "Beta", score: 3, playerIds: ["p3"] },
				],
				players: [
					{
						id: ownerId,
						name: "Host",
						role: "registered",
						teamId: "team-2",
						isReady: true,
						isOnline: true,
					},
					{
						id: "p1",
						name: "Solo Explainer",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: true,
					},
					{
						id: "p3",
						name: "Charlie",
						role: "registered",
						teamId: "team-2",
						isReady: true,
						isOnline: true,
					},
				],
				currentRound: {
					id: "round-1",
					teamId: "team-1",
					explainerId: "p1",
					roundNumber: 1,
					status: RoundStatus.IN_PROGRESS,
					words: [],
					currentWord: null,
					expiresAt: now + 35000,
				},
			});

			engine.dispatch(
				{
					type: "LEAVE_GAME",
					actorId: "p1",
					payload: { playerId: "p1" },
				},
				now,
			);

			const state = engine.toPrimitives();
			expect(state.currentRound?.status).toBe(RoundStatus.FINISHED);
		});

		it("SET_EXPLAINER unpauses round and sets new expiresAt when assigning a new explainer", () => {
			const engine = createMidGameEngine({
				currentRound: {
					id: "round-1",
					teamId: "team-1",
					explainerId: "p1",
					roundNumber: 1,
					status: RoundStatus.IN_PROGRESS,
					words: [],
					currentWord: { id: "w-1", text: "WORD", score: 1 },
					expiresAt: now + 35000,
					pausedAt: now,
					remainingMs: 35000,
				},
			});

			const newTime = now + 5000;
			engine.dispatch(
				{
					type: "SET_EXPLAINER",
					actorId: ownerId,
					payload: { explainerId: "p2" },
				},
				newTime,
			);

			const state = engine.toPrimitives();
			expect(state.currentRound?.explainerId).toBe("p2");
			expect(state.currentRound?.pausedAt).toBeNull();
			expect(state.currentRound?.remainingMs).toBeNull();
			expect(state.currentRound?.expiresAt).toBe(newTime + 35000);
			expect(state.teams[0].lastExplainerId).toBe("p2");
		});
	});

	describe("Round & Moderation Actions (TOGGLE_ROUND_READY, SET_EXPLAINER, CHANGE_ROUND_TIME, DELETE_GAME)", () => {
		it("TOGGLE_ROUND_READY toggles player isRoundReady", () => {
			const engine = createLobbyEngine();

			engine.dispatch({
				type: "TOGGLE_ROUND_READY",
				actorId: "p2",
				payload: { playerId: "p2" },
			});
			expect(
				engine.getState().players.find((p) => p.id === "p2")
					?.isRoundReady,
			).toBe(true);

			engine.dispatch({
				type: "TOGGLE_ROUND_READY",
				actorId: "p2",
				payload: { playerId: "p2" },
			});
			expect(
				engine.getState().players.find((p) => p.id === "p2")
					?.isRoundReady,
			).toBe(false);
		});

		it("SET_EXPLAINER allows owner to change explainer during PENDING round", () => {
			const engine = createLobbyEngine();
			engine.dispatch({ type: "START_GAME", actorId: ownerId });

			expect(engine.getState().currentRound?.explainerId).toBe(ownerId);

			engine.dispatch({
				type: "SET_EXPLAINER",
				actorId: ownerId,
				payload: { explainerId: "p2" },
			});

			const round = engine.toPrimitives().currentRound;
			expect(round?.explainerId).toBe("p2");
		});

		it("SET_EXPLAINER throws PlayerNotFoundError if player is not on active team", () => {
			const engine = createLobbyEngine();
			engine.dispatch({ type: "START_GAME", actorId: ownerId });

			expect(() =>
				engine.dispatch({
					type: "SET_EXPLAINER",
					actorId: ownerId,
					payload: { explainerId: "p3" },
				}),
			).toThrow(PlayerNotFoundError);
		});

		it("SET_EXPLAINER throws RoundIsNotPending if round already started", () => {
			const engine = createLobbyEngine();
			engine.dispatch({ type: "START_GAME", actorId: ownerId });
			engine.dispatch({
				type: "START_ROUND",
				actorId: ownerId,
				payload: { durationSeconds: 60, firstWordText: "WORD" },
			});

			expect(() =>
				engine.dispatch({
					type: "SET_EXPLAINER",
					actorId: ownerId,
					payload: { explainerId: "p2" },
				}),
			).toThrow(RoundIsNotPending);
		});

		it("CHANGE_ROUND_TIME updates currentRound.expiresAt when round is IN_PROGRESS", () => {
			const engine = createLobbyEngine();
			engine.dispatch({ type: "START_GAME", actorId: ownerId });
			engine.dispatch({
				type: "START_ROUND",
				actorId: ownerId,
				payload: { durationSeconds: 60, firstWordText: "WORD" },
			});

			engine.dispatch({
				type: "CHANGE_ROUND_TIME",
				actorId: ownerId,
				payload: { expiresAt: 999999 },
			});

			expect(engine.getState().currentRound?.expiresAt).toBe(999999);
		});

		it("CHANGE_ROUND_TIME throws RoundIsNotInProgress when round is PENDING", () => {
			const engine = createLobbyEngine();
			engine.dispatch({ type: "START_GAME", actorId: ownerId });

			expect(() =>
				engine.dispatch({
					type: "CHANGE_ROUND_TIME",
					actorId: ownerId,
					payload: { expiresAt: 999999 },
				}),
			).toThrow(RoundIsNotInProgress);
		});

		it("DELETE_GAME emits GameDeletedEvent and enforces requireFinished when requested", () => {
			const engine = createLobbyEngine();

			expect(() =>
				engine.dispatch({
					type: "DELETE_GAME",
					actorId: ownerId,
					payload: { requireFinished: true },
				}),
			).toThrow(GameNotFinishedError);

			engine.dispatch({
				type: "DELETE_GAME",
				actorId: ownerId,
			});

			const events = engine.pullDomainEvents();
			expect(events.some((e) => e.name === "GameDeletedEvent")).toBe(
				true,
			);
		});

		it("Owner-only actions throw PlayerNotRoomOwnerError when invoked by non-owner", () => {
			const engine = createLobbyEngine();
			expect(() =>
				engine.dispatch({
					type: "UPDATE_SETTINGS",
					actorId: "p2",
					payload: { pointsToWin: 10 },
				}),
			).toThrow(PlayerNotRoomOwnerError);
		});

		it("Lobby-only actions throw GameNotInLobbyError when game is IN_PROGRESS", () => {
			const engine = createLobbyEngine();
			engine.dispatch({ type: "START_GAME", actorId: ownerId });

			expect(() =>
				engine.dispatch({
					type: "TOGGLE_READY",
					actorId: "p2",
					payload: { playerId: "p2" },
				}),
			).toThrow(GameNotInLobbyError);
		});
	});

	describe("Ownership Transfer Flow (Step 6)", () => {
		const now = 100000;

		const createEngineWithOwnerOffline = (
			overrides?: Partial<GameState>,
		): GameEngine => {
			return GameEngine.fromPrimitives({
				id: "room-owner-transfer",
				ownerId,
				status: "IN_PROGRESS",
				pointsToWin: 30,
				activeTeamId: "team-1",
				ownerOfflineSince: now,
				teams: [
					{
						id: "team-1",
						name: "Alpha",
						score: 5,
						playerIds: [ownerId, "p1"],
					},
					{
						id: "team-2",
						name: "Beta",
						score: 3,
						playerIds: ["p2"],
					},
				],
				players: [
					{
						id: ownerId,
						name: "Host",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: false,
					},
					{
						id: "p1",
						name: "Alice",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: true,
					},
					{
						id: "p2",
						name: "Bob",
						role: "registered",
						teamId: "team-2",
						isReady: true,
						isOnline: true,
					},
					{
						id: "p3",
						name: "Spectator Charlie",
						role: "registered",
						isReady: false,
						isOnline: true,
					},
				],
				spectators: ["p3"],
				bannedPlayerIds: [],
				currentRound: null,
				activeEffects: [],
				addons: {},
				...overrides,
			});
		};

		it("TRANSFER_OWNERSHIP transfers ownership to next online team player when timeout (60s) has passed", () => {
			const engine = createEngineWithOwnerOffline();

			// Timeout passed: now + 60_000
			engine.dispatch(
				{ type: "TRANSFER_OWNERSHIP", actorId: "system" },
				now + OWNER_OFFLINE_TIMEOUT_MS,
			);

			const state = engine.toPrimitives();
			expect(state.ownerId).toBe("p1");
			expect(state.ownerOfflineSince).toBeNull();
		});

		it("TRANSFER_OWNERSHIP does not transfer ownership if timeout has NOT passed", () => {
			const engine = createEngineWithOwnerOffline();

			// Only 30s passed
			engine.dispatch(
				{ type: "TRANSFER_OWNERSHIP", actorId: "system" },
				now + 30000,
			);

			const state = engine.toPrimitives();
			expect(state.ownerId).toBe(ownerId);
			expect(state.ownerOfflineSince).toBe(now);
		});

		it("TRANSFER_OWNERSHIP does not transfer ownership if owner returned online before timeout", () => {
			const engine = createEngineWithOwnerOffline();

			// Owner reconnects at now + 20s
			engine.dispatch(
				{
					type: "JOIN_GAME",
					actorId: ownerId,
					payload: {
						playerId: ownerId,
						name: "Host",
						role: "registered",
					},
				},
				now + 20000,
			);

			expect(engine.getState().ownerOfflineSince).toBeNull();

			// Later scheduler fires at now + 60s
			engine.dispatch(
				{ type: "TRANSFER_OWNERSHIP", actorId: "system" },
				now + OWNER_OFFLINE_TIMEOUT_MS,
			);

			expect(engine.getState().ownerId).toBe(ownerId);
		});

		it("TRANSFER_OWNERSHIP falls back to online spectator if no team players are online", () => {
			const engine = createEngineWithOwnerOffline({
				players: [
					{
						id: ownerId,
						name: "Host",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: false,
					},
					{
						id: "p1",
						name: "Alice",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: false,
					},
					{
						id: "p2",
						name: "Bob",
						role: "registered",
						teamId: "team-2",
						isReady: true,
						isOnline: false,
					},
					{
						id: "p3",
						name: "Spectator Charlie",
						role: "registered",
						isReady: false,
						isOnline: true,
					},
				],
			});

			engine.dispatch(
				{ type: "TRANSFER_OWNERSHIP", actorId: "system" },
				now + OWNER_OFFLINE_TIMEOUT_MS,
			);

			const state = engine.toPrimitives();
			expect(state.ownerId).toBe("p3");
			expect(state.ownerOfflineSince).toBeNull();
		});

		it("TRANSFER_OWNERSHIP keeps original owner if no candidates are online", () => {
			const engine = createEngineWithOwnerOffline({
				players: [
					{
						id: ownerId,
						name: "Host",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: false,
					},
					{
						id: "p1",
						name: "Alice",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: false,
					},
				],
			});

			engine.dispatch(
				{ type: "TRANSFER_OWNERSHIP", actorId: "system" },
				now + OWNER_OFFLINE_TIMEOUT_MS,
			);

			const state = engine.toPrimitives();
			expect(state.ownerId).toBe(ownerId);
		});

		it("TRANSFER_OWNERSHIP allows current owner to explicitly transfer ownership to another player", () => {
			const engine = createEngineWithOwnerOffline({
				ownerOfflineSince: null,
				players: [
					{
						id: ownerId,
						name: "Host",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: true,
					},
					{
						id: "p2",
						name: "Bob",
						role: "registered",
						teamId: "team-2",
						isReady: true,
						isOnline: true,
					},
				],
			});

			engine.dispatch({
				type: "TRANSFER_OWNERSHIP",
				actorId: ownerId,
				payload: { newOwnerId: "p2" },
			});

			expect(engine.getState().ownerId).toBe("p2");
		});

		it("TRANSFER_OWNERSHIP throws PlayerNotRoomOwnerError if non-owner tries to explicitly transfer", () => {
			const engine = createEngineWithOwnerOffline({
				players: [
					{
						id: ownerId,
						name: "Host",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: true,
					},
					{
						id: "p1",
						name: "Alice",
						role: "registered",
						teamId: "team-1",
						isReady: true,
						isOnline: true,
					},
				],
			});

			expect(() =>
				engine.dispatch({
					type: "TRANSFER_OWNERSHIP",
					actorId: "p1",
					payload: { newOwnerId: "p1" },
				}),
			).toThrow(PlayerNotRoomOwnerError);
		});
	});
});
