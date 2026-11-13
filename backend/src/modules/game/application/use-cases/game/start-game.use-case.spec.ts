import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { DictionaryService } from "../../dictionary.service";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { StartGameUseCase } from "./start-game.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import { RoundStatus, type GameState } from "../../../domain";
import { GAME_STARTED } from "../../game.events";

describe("StartGameUseCase (with Addon Pipeline & FIFO Queue) - TDD", () => {
	let useCase: StartGameUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let gameRepository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;
	let dictionaryService: jest.Mocked<DictionaryService>;

	const roomId = "room-123";
	const ownerId = "owner-1";
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
			settings: {
				isHatMode: false,
				wordPackSelections: [{ packId: "standard-pack", count: 20 }],
			},
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
				{ id: "p2", name: "Bob", teamId: "team-2", isReady: true },
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
			removeUserRoom: jest.fn(),
			removeUserRooms: jest.fn(),
		} as unknown as jest.Mocked<IGameRepository>;

		eventEmitter = {
			emit: jest.fn(),
		} as unknown as jest.Mocked<EventEmitter2>;

		dictionaryService = {
			loadGameWords: jest.fn().mockResolvedValue(undefined),
			loadShuffledCustomWords: jest.fn().mockResolvedValue(undefined),
			popWordForGame: jest.fn(),
		} as unknown as jest.Mocked<DictionaryService>;

		useCase = new StartGameUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
			dictionaryService,
		);
	});

	it("successfully loads standard words, starts game, creates round 1, saves, and emits GAME_STARTED", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const result = await useCase.execute(roomId, actorOwner);

		// Loaded dictionary words
		expect(dictionaryService.loadGameWords).toHaveBeenCalledWith(roomId, [
			{ packId: "standard-pack", count: 20 },
		]);

		// Game transitioned to IN_PROGRESS
		expect(engine.getState().status).toBe("IN_PROGRESS");
		expect(engine.getState().activeTeamId).toBe("team-1");

		// Initial round created
		const currentRound = engine.getState().currentRound;
		expect(currentRound).toBeDefined();
		expect(currentRound?.roundNumber).toBe(1);
		expect(currentRound?.teamId).toBe("team-1");
		expect(currentRound?.explainerId).toBe(ownerId);
		expect(currentRound?.status).toBe(RoundStatus.PENDING);

		// Saved state
		expect(gameRepository.saveGame).toHaveBeenCalledWith(engine);

		// Emitted event
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			GAME_STARTED,
			expect.objectContaining({
				room: expect.objectContaining({
					id: roomId,
					status: "IN_PROGRESS",
				}),
			}),
		);

		expect(result.status).toBe("IN_PROGRESS");
	});

	it("loads custom words when isHatMode is true", async () => {
		const customSelection = [{ packId: "custom-pack", count: 10 }];
		const engine = createTestEngine({
			settings: {
				isHatMode: true,
				wordPackSelections: customSelection,
			},
		});
		gameSharedService.loadGame.mockResolvedValue(engine);

		await useCase.execute(roomId, actorOwner);

		expect(dictionaryService.loadShuffledCustomWords).toHaveBeenCalledWith(
			roomId,
			[ownerId, "p2"],
			customSelection,
		);
		expect(dictionaryService.loadGameWords).not.toHaveBeenCalled();
		expect(engine.getState().status).toBe("IN_PROGRESS");
	});

	it("throws error if actor is not the owner", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const impostor: UserDto = {
			id: "intruder-1",
			name: "Eve",
			role: "registered",
		};

		await expect(useCase.execute(roomId, impostor)).rejects.toThrow(
			"Only the room owner can start the game",
		);
		expect(gameRepository.saveGame).not.toHaveBeenCalled();
	});

	it("throws error if game is not in LOBBY status", async () => {
		const engine = createTestEngine({ status: "IN_PROGRESS" });
		gameSharedService.loadGame.mockResolvedValue(engine);

		await expect(useCase.execute(roomId, actorOwner)).rejects.toThrow(
			"Game can only be started from LOBBY",
		);
	});

	it("throws error if fewer than 2 teams exist", async () => {
		const engine = createTestEngine({
			teams: [{ id: "team-1", name: "Red", color: "#FF0000", score: 0 }],
		});
		gameSharedService.loadGame.mockResolvedValue(engine);

		await expect(useCase.execute(roomId, actorOwner)).rejects.toThrow(
			"Need at least 2 teams to start the game",
		);
	});

	it("throws error if players are not ready and does not load/wipe dictionary words", async () => {
		const engine = createTestEngine({
			settings: {
				isHatMode: true,
				wordPackSelections: [{ packId: "standard-pack", count: 20 }],
			},
			players: [
				{
					id: ownerId,
					name: "Alice",
					teamId: "team-1",
					isReady: false,
				},
				{ id: "p2", name: "Bob", teamId: "team-2", isReady: true },
			],
		});
		gameSharedService.loadGame.mockResolvedValue(engine);

		await expect(useCase.execute(roomId, actorOwner)).rejects.toThrow(
			"All team players must be ready to start",
		);
		expect(
			dictionaryService.loadShuffledCustomWords,
		).not.toHaveBeenCalled();
		expect(dictionaryService.loadGameWords).not.toHaveBeenCalled();
		expect(gameRepository.saveGame).not.toHaveBeenCalled();
	});
});
