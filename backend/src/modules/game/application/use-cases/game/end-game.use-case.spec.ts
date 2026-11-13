import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { EndGameDto } from "../../dto/body/end-game.dto";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import type { RoundScheduler } from "../../round-scheduler.service";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { EndGameUseCase } from "./end-game.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import { RoundStatus, type GameState } from "../../../domain";
import { GAME_FINISHED, GAME_UPDATED } from "../../game.events";

describe("EndGameUseCase (with Addon Pipeline & FIFO Queue) - TDD", () => {
	let useCase: EndGameUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let gameRepository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;
	let roundScheduler: jest.Mocked<RoundScheduler>;

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
			status: "IN_PROGRESS",
			pointsToWin: 30,
			teams: [
				{ id: "team-1", name: "Red", color: "#FF0000", score: 15 },
				{ id: "team-2", name: "Blue", color: "#0000FF", score: 25 },
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
			activeTeamId: "team-1",
			currentRound: {
				id: "r-1",
				explainerId: ownerId,
				teamId: "team-1",
				status: RoundStatus.IN_PROGRESS,
				currentWord: null,
				words: [],
				roundNumber: 1,
				expiresAt: 100,
			},
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

		roundScheduler = {
			clearRoundTimeout: jest.fn(),
			scheduleGameDeletion: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<RoundScheduler>;

		useCase = new EndGameUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
			roundScheduler,
		);
	});

	it("successfully ends game, calculates winner, saves state, and emits GAME_UPDATED and GAME_FINISHED", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: EndGameDto = { roomId };
		const result = await useCase.execute(dto, actorOwner);

		// Status is FINISHED
		expect(engine.getState().status).toBe("FINISHED");
		expect(engine.getState().currentRound).toBeNull();

		// Team 2 had highest score (25 > 15)
		expect(engine.getState().winnerTeamId).toBe("team-2");

		// Cleared round timeout & scheduled deletion
		expect(roundScheduler.clearRoundTimeout).toHaveBeenCalledWith(roomId);
		expect(roundScheduler.scheduleGameDeletion).toHaveBeenCalledWith(
			roomId,
			24 * 60 * 60 * 1000,
		);

		// Saved state
		expect(gameRepository.saveGame).toHaveBeenCalledWith(engine);

		// GAME_UPDATED & GAME_FINISHED emitted
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			GAME_UPDATED,
			expect.objectContaining({
				room: expect.objectContaining({
					id: roomId,
					status: "FINISHED",
					winnerTeamId: "team-2",
				}),
			}),
		);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			GAME_FINISHED,
			expect.objectContaining({
				room: expect.objectContaining({
					id: roomId,
					status: "FINISHED",
				}),
			}),
		);

		expect(result.status).toBe("FINISHED");
		expect(result.winnerTeamId).toBe("team-2");
	});

	it("throws error if actor is not the owner", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const impostor: UserDto = {
			id: "intruder-1",
			name: "Eve",
			role: "registered",
		};

		const dto: EndGameDto = { roomId };
		await expect(useCase.execute(dto, impostor)).rejects.toThrow(
			"Only the room owner can end the game",
		);
		expect(gameRepository.saveGame).not.toHaveBeenCalled();
	});

	it("throws error if game is not in IN_PROGRESS status", async () => {
		const engine = createTestEngine({ status: "LOBBY" });
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: EndGameDto = { roomId };
		await expect(useCase.execute(dto, actorOwner)).rejects.toThrow(
			"Cannot end game: game is not IN_PROGRESS",
		);
	});
});
