import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { EndPointingDto } from "../../dto/body";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import type { RoundScheduler } from "../../round-scheduler.service";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { EndPointingUseCase } from "./end-pointing.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import { RoundStatus, type GameState } from "../../../domain";
import { GAME_UPDATED } from "../../game.events";
import { PlayerNotRoomOwnerError } from "../../../domain/errors/game.errors";

describe("EndPointingUseCase (with Addon Pipeline & FIFO Queue) - TDD", () => {
	let useCase: EndPointingUseCase;
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
			pointsToWin: 20,
			teams: [
				{ id: "team-1", name: "Red", color: "#FF0000", score: 10 },
				{ id: "team-2", name: "Blue", color: "#0000FF", score: 5 },
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
				status: RoundStatus.POINTING,
				currentWord: null,
				words: [
					{ id: "w-1", text: "SUN", score: 1 },
					{ id: "w-2", text: "MOON", score: 1 },
				],
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
			scheduleRoundTimeout: jest.fn(),
			clearRoundTimeout: jest.fn(),
			scheduleGameDeletion: jest.fn(),
		} as unknown as jest.Mocked<RoundScheduler>;

		useCase = new EndPointingUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
			roundScheduler,
		);
	});

	it("finalizes round score and leaves game IN_PROGRESS when pointsToWin is not reached", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: EndPointingDto = { roomId };
		await useCase.execute(dto, actorOwner);

		// Round transitioned to FINISHED
		expect(engine.getState().currentRound?.status).toBe(
			RoundStatus.FINISHED,
		);
		// Game is still IN_PROGRESS (score 10 < pointsToWin 20)
		expect(engine.getState().status).toBe("IN_PROGRESS");

		// No game deletion scheduled
		expect(roundScheduler.scheduleGameDeletion).not.toHaveBeenCalled();

		// State saved
		expect(gameRepository.saveGame).toHaveBeenCalledWith(engine);

		// GAME_UPDATED emitted
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			GAME_UPDATED,
			expect.objectContaining({
				room: expect.objectContaining({ id: roomId }),
			}),
		);
	});

	it("finalizes round and marks game as FINISHED and schedules deletion when pointsToWin is reached", async () => {
		const engine = createTestEngine({
			pointsToWin: 10,
			teams: [
				{ id: "team-1", name: "Red", color: "#FF0000", score: 10 },
				{ id: "team-2", name: "Blue", color: "#0000FF", score: 5 },
			],
		});
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: EndPointingDto = { roomId };
		await useCase.execute(dto, actorOwner);

		expect(engine.getState().currentRound?.status).toBe(
			RoundStatus.FINISHED,
		);
		expect(engine.getState().status).toBe("FINISHED");

		// 24 hours deletion scheduled
		expect(roundScheduler.scheduleGameDeletion).toHaveBeenCalledWith(
			roomId,
			24 * 60 * 60 * 1000,
		);

		expect(gameRepository.saveGame).toHaveBeenCalledWith(engine);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			GAME_UPDATED,
			expect.objectContaining({
				room: expect.objectContaining({
					id: roomId,
					status: "FINISHED",
				}),
			}),
		);
	});

	it("throws PlayerNotRoomOwnerError if actor is not the room owner", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const notOwner: UserDto = {
			id: "other-user",
			name: "Charlie",
			role: "registered",
		};

		const dto: EndPointingDto = { roomId };
		await expect(useCase.execute(dto, notOwner)).rejects.toThrow(
			PlayerNotRoomOwnerError,
		);
		expect(gameRepository.saveGame).not.toHaveBeenCalled();
	});

	it("throws error if round is not in POINTING status", async () => {
		const engine = createTestEngine({
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
		});
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: EndPointingDto = { roomId };
		await expect(useCase.execute(dto, actorOwner)).rejects.toThrow(
			"Cannot end pointing: round is not in POINTING status",
		);
	});
});
