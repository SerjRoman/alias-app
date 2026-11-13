import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { StartPointingDto } from "../../dto/body";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import type { RoundScheduler } from "../../round-scheduler.service";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { StartPointingUseCase } from "./start-pointing.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import { RoundStatus, type GameState } from "../../../domain";
import { ROUND_UPDATED } from "../../game.events";
import { RoundNotActiveError } from "../../../domain/errors/round.errors";

describe("StartPointingUseCase (with Addon Pipeline & FIFO Queue) - TDD", () => {
	let useCase: StartPointingUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let gameRepository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;
	let roundScheduler: jest.Mocked<RoundScheduler>;

	const roomId = "room-123";
	const ownerId = "owner-1";
	const explainerId = "explainer-1";
	const actor: UserDto = {
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
				{ id: "team-1", name: "Red", color: "#FF0000", score: 5 },
				{ id: "team-2", name: "Blue", color: "#0000FF", score: 0 },
			],
			players: [
				{
					id: explainerId,
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
				explainerId,
				teamId: "team-1",
				status: RoundStatus.IN_PROGRESS,
				currentWord: { id: "w-last", text: "PLANET", score: 0 },
				words: [{ id: "w-prev", text: "STAR", score: 1 }],
				roundNumber: 1,
				expiresAt: Date.now() + 30000,
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

		useCase = new StartPointingUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
			roundScheduler,
		);
	});

	it("successfully transitions round to POINTING, archives currentWord, clears timeout, saves and emits event", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: StartPointingDto = { roomId };
		const result = await useCase.execute(dto, actor);

		// Round status transitioned to POINTING
		const currentRound = engine.getState().currentRound;
		expect(currentRound?.status).toBe(RoundStatus.POINTING);

		// The active word on screen was moved to history with score 0
		expect(currentRound?.words).toHaveLength(2);
		expect(currentRound?.words[1].text).toBe("PLANET");
		expect(currentRound?.words[1].score).toBe(0);
		expect(currentRound?.currentWord).toBeNull();

		// Cleared scheduled timeout
		expect(roundScheduler.clearRoundTimeout).toHaveBeenCalledWith(roomId);

		// Saved state
		expect(gameRepository.saveGame).toHaveBeenCalledWith(engine);

		// Emitted ROUND_UPDATED event
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			ROUND_UPDATED,
			expect.objectContaining({
				roomId,
				round: expect.objectContaining({
					id: "r-1",
					status: RoundStatus.POINTING,
				}),
			}),
		);

		// Returned payload matches
		expect(result).toEqual({
			roomId,
			round: currentRound,
		});
	});

	it("throws RoundNotActiveError if currentRound is null", async () => {
		const engine = createTestEngine({ currentRound: null });
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: StartPointingDto = { roomId };
		await expect(useCase.execute(dto, actor)).rejects.toThrow(
			RoundNotActiveError,
		);
		expect(roundScheduler.clearRoundTimeout).not.toHaveBeenCalled();
		expect(gameRepository.saveGame).not.toHaveBeenCalled();
	});

	it("throws error if round is not in IN_PROGRESS status", async () => {
		const engine = createTestEngine({
			currentRound: {
				id: "r-1",
				explainerId,
				teamId: "team-1",
				status: RoundStatus.PENDING,
				currentWord: null,
				words: [],
				roundNumber: 1,
				expiresAt: 0,
			},
		});
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: StartPointingDto = { roomId };
		await expect(useCase.execute(dto, actor)).rejects.toThrow(
			"Cannot enter pointing: round is not IN_PROGRESS",
		);
	});

	it("throws PlayerNotRoomOwnerError if actor is not the room owner", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const notOwner: UserDto = {
			id: "p2",
			name: "Bob",
			role: "registered",
		};

		const dto: StartPointingDto = { roomId };
		await expect(useCase.execute(dto, notOwner)).rejects.toThrow(
			"User is not the owner of the room",
		);
		expect(roundScheduler.clearRoundTimeout).not.toHaveBeenCalled();
		expect(gameRepository.saveGame).not.toHaveBeenCalled();
	});
});
