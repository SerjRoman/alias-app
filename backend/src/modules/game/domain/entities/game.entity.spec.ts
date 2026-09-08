import { GameEntity, GameStatus, type GameSettings } from "./game.entity";
import {
	PlayerAlreadyInGameError,
	PlayerNotRoomOwnerError,
	PlayerPermanentlyKickedError,
} from "../errors/game.errors";

describe("GameEntity Domain", () => {
	const ownerId = "owner-123";
	let defaultSettings: GameSettings;

	beforeEach(() => {
		defaultSettings = {
			name: "Test Room",
			roundTimeSeconds: 60,
			pointsToWin: 50,
			code: "ABCD",
			isPrivate: false,
			wordPackSelections: [{ packId: "pack-1", count: 100 }],
			wordsPerPlayer: 0,
			isHatMode: false,
			isOnlyOwnerCanNextRound: false,
			isOnlyOwnerCanChangeScore: false,
			isVoiceChatEnabled: true,
		};
	});

	describe("Creation", () => {
		it("should correctly initialize a new game with default state and settings", () => {
			const game = GameEntity.create(ownerId, defaultSettings);

			expect(game.id).toBeDefined();
			expect(game.ownerId).toBe(ownerId);
			expect(game.status).toBe(GameStatus.LOBBY);
			expect(game.settings).toEqual(defaultSettings);
			expect(game.players).toHaveLength(0);
			expect(game.teams).toHaveLength(0);
			expect(game.currentRound).toBeNull();
			expect(game.winnerTeamId).toBeNull();
		});
	});

	describe("Settings Management", () => {
		it("should allow the room owner to update settings in LOBBY status", () => {
			const game = GameEntity.create(ownerId, defaultSettings);

			game.updateSettings({ roundTimeSeconds: 90 }, ownerId);

			expect(game.settings.roundTimeSeconds).toBe(90);
		});

		it("should throw PlayerNotRoomOwnerError if a non-owner tries to update settings", () => {
			const game = GameEntity.create(ownerId, defaultSettings);

			expect(() => {
				game.updateSettings({ roundTimeSeconds: 90 }, "not-owner");
			}).toThrow(PlayerNotRoomOwnerError);
		});
	});

	describe("Players & Teams", () => {
		it("should allow players to join the lobby", () => {
			const game = GameEntity.create(ownerId, defaultSettings);
			const playerId = "player-1";

			game.joinRoom(playerId, "John Doe");

			expect(game.players).toHaveLength(1);
			expect(game.players[0].id).toBe(playerId);
			expect(game.players[0].name).toBe("John Doe");
			expect(game.players[0].isOnline).toBe(true);
		});

		it("should throw PlayerAlreadyInGameError when adding an existing player id", () => {
			const game = GameEntity.create(ownerId, defaultSettings);
			const playerId = "player-1";

			game.joinRoom(playerId, "John Doe");

			expect(() => {
				game.joinRoom(playerId, "John Duplicate");
			}).toThrow(PlayerAlreadyInGameError);
		});

		it("should allow the owner to create a team", () => {
			const game = GameEntity.create(ownerId, defaultSettings);

			const team = game.createTeam(ownerId, "Red Team");

			expect(game.teams).toHaveLength(1);
			expect(game.teams[0].id).toBe(team.id);
			expect(game.teams[0].name).toBe("Red Team");
		});

		it("should allow moving players to a team", () => {
			const game = GameEntity.create(ownerId, defaultSettings);
			const playerId = "player-1";
			game.joinRoom(playerId, "John Doe");
			const team = game.createTeam(ownerId, "Red Team");

			game.movePlayerToTeam(playerId, team.id);

			expect(game.teams[0].playerIds.has(playerId)).toBe(true);
		});
	});

	describe("Spectators", () => {
		it("should allow moving player to spectators in lobby", () => {
			const game = GameEntity.create(ownerId, defaultSettings);
			const playerId = "player-1";
			game.joinRoom(playerId, "John Doe");
			const team = game.createTeam(ownerId, "Red Team");
			game.movePlayerToTeam(playerId, team.id);
			expect(game.teams[0].playerIds.has(playerId)).toBe(true);

			game.moveToSpectators(playerId);

			expect(game.teams[0].playerIds.has(playerId)).toBe(false);
			expect(game.spectators).toContain(playerId);
			const player = game.players.find((p) => p.id === playerId);
			expect(player?.isReady).toBe(false);
		});

		it("should exclude spectators from readiness requirements when starting game", () => {
			const game = GameEntity.create(ownerId, defaultSettings);
			const p1 = "p1";
			const p2 = "p2";
			const spec = "spec";

			game.joinRoom(p1, "Player 1");
			game.joinRoom(p2, "Player 2");
			game.joinRoom(spec, "Spectator");

			const t1 = game.createTeam(ownerId, "Team 1");
			const t2 = game.createTeam(ownerId, "Team 2");

			game.movePlayerToTeam(p1, t1.id);
			game.movePlayerToTeam(p2, t2.id);
			game.moveToSpectators(spec);

			game.togglePlayerGameReady(p1);
			game.togglePlayerGameReady(p2);
			// spec is NOT ready

			expect(() => game.startGame(ownerId)).not.toThrow();
			expect(game.status).toBe(GameStatus.IN_PROGRESS);
			expect(game.spectators).toContain(spec);
		});

		it("should automatically add new players joining mid-game to spectators", () => {
			const game = GameEntity.create(ownerId, defaultSettings);
			const p1 = "p1";
			const p2 = "p2";
			game.joinRoom(p1, "Player 1");
			game.joinRoom(p2, "Player 2");
			const t1 = game.createTeam(ownerId, "Team 1");
			const t2 = game.createTeam(ownerId, "Team 2");
			game.movePlayerToTeam(p1, t1.id);
			game.movePlayerToTeam(p2, t2.id);
			game.togglePlayerGameReady(p1);
			game.togglePlayerGameReady(p2);
			game.startGame(ownerId);

			const midGamePlayer = "mid-game-player";
			game.joinRoom(midGamePlayer, "Late Joiner");

			expect(game.spectators).toContain(midGamePlayer);
		});

		it("should remove spectator on leaveGame and removePlayer", () => {
			const game = GameEntity.create(ownerId, defaultSettings);
			const spec = "spec";
			game.joinRoom(spec, "Spectator");
			game.moveToSpectators(spec);
			expect(game.spectators).toContain(spec);

			game.leaveGame(spec);
			expect(game.spectators).not.toContain(spec);
			expect(game.players.find((p) => p.id === spec)).toBeUndefined();
		});
	});

	describe("Kicking and Banning (Exclusions)", () => {
		it("should temporarily kick a player by setting their offline status", () => {
			const game = GameEntity.create(ownerId, defaultSettings);
			const playerId = "player-1";
			game.joinRoom(playerId, "John Doe");

			game.kickPlayer(ownerId, playerId);

			const player = game.players.find((p) => p.id === playerId);
			expect(player).toBeDefined();
			expect(player?.isOnline).toBe(false);
		});

		it("should permanently ban a player and prevent them from re-joining", () => {
			const game = GameEntity.create(ownerId, defaultSettings);
			const playerId = "player-1";
			game.joinRoom(playerId, "John Doe");

			game.banPlayer(ownerId, playerId);

			expect(game.players.find((p) => p.id === playerId)).toBeUndefined();

			expect(() => {
				game.joinRoom(playerId, "John Doe");
			}).toThrow(PlayerPermanentlyKickedError);
		});
	});
});
