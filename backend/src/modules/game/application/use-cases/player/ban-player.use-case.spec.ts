import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { BanPlayerDto } from "../../dto/body";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { BanPlayerUseCase } from "./ban-player.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import type { GameState } from "../../../domain";
import {
	PLAYER_KICKED,
	TEAMS_UPDATED,
	PLAYERS_UPDATED,
	GAME_UPDATED,
} from "../../game.events";

describe("BanPlayerUseCase (with Addon Pipeline & FIFO Queue) - TDD", () => {
	let useCase: BanPlayerUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let gameRepository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;

	const roomId = "room-123";
	const ownerId = "owner-1";
	const targetPlayerId = "player-target";

	const actorOwner: UserDto = {
		id: ownerId,
		name: "Alice",
		role: "registered",
	};

	const createTestEngine = (overrides?: Partial<GameState>): GameEngine => {
		const state: GameState = {
			id: roomId,
			ownerId,
			status: "LOBBY",
			pointsToWin: 30,
			teams: [
				{ id: "team-1", name: "Red", color: "#FF0000", score: 0 },
				{ id: "team-2", name: "Blue", color: "#0000FF", score: 0 },
			],
			players: [
				{
					id: ownerId,
					name: "Alice",
					teamId: "team-1",
					isReady: true,
				},
				{
					id: targetPlayerId,
					name: "Bob",
					teamId: "team-2",
					isReady: true,
				},
			],
			bannedPlayerIds: [],
			activeTeamId: null,
			currentRound: null,
			activeEffects: [],
			addons: {},
			...overrides,
		};
		return GameEngine.fromPrimitives(state);
	};

	beforeEach(() => {
		fifoQueue = new RoomFifoQueueService();

		gameSharedService = {
			loadGame: jest.fn(),
		} as unknown as jest.Mocked<GameSharedService>;

		gameRepository = {
			saveGame: jest.fn().mockResolvedValue(undefined),
			findGameById: jest.fn(),
			findAllGames: jest.fn(),
			deleteGame: jest.fn(),
			setGameTtl: jest.fn(),
			setUserRoom: jest.fn(),
			getUserRoom: jest.fn(),
			removeUserRoom: jest.fn().mockResolvedValue(undefined),
			removeUserRooms: jest.fn(),
		} as unknown as jest.Mocked<IGameRepository>;

		eventEmitter = {
			emit: jest.fn(),
		} as unknown as jest.Mocked<EventEmitter2>;

		useCase = new BanPlayerUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
		);
	});

	it("successfully bans player, adds to bannedPlayerIds, saves, and emits all events", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: BanPlayerDto = { roomId, playerId: targetPlayerId };
		const result = await useCase.execute(dto, actorOwner);

		// Player removed from players list
		expect(engine.getState().players).toHaveLength(1);
		expect(engine.getState().players[0].id).toBe(ownerId);

		// Added to bannedPlayerIds
		expect(engine.getState().bannedPlayerIds).toContain(targetPlayerId);

		// Saved state
		expect(gameRepository.saveGame).toHaveBeenCalledWith(engine);

		// User room removed
		expect(gameRepository.removeUserRoom).toHaveBeenCalledWith(
			targetPlayerId,
		);

		// Emitted events
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			PLAYER_KICKED,
			expect.objectContaining({
				roomId,
				kickedUserId: targetPlayerId,
			}),
		);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			TEAMS_UPDATED,
			expect.objectContaining({ roomId }),
		);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			PLAYERS_UPDATED,
			expect.objectContaining({ roomId }),
		);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			GAME_UPDATED,
			expect.objectContaining({
				room: expect.objectContaining({ id: roomId }),
			}),
		);

		expect(result.bannedPlayerIds).toContain(targetPlayerId);
	});

	it("throws error if actor is not the room owner", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const notOwner: UserDto = {
			id: "intruder",
			name: "Charlie",
			role: "registered",
		};

		const dto: BanPlayerDto = { roomId, playerId: targetPlayerId };
		await expect(useCase.execute(dto, notOwner)).rejects.toThrow(
			"Only room owner can kick players",
		);

		expect(gameRepository.saveGame).not.toHaveBeenCalled();
		expect(gameRepository.removeUserRoom).not.toHaveBeenCalled();
	});
});
