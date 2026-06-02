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
			level: "medium",
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
