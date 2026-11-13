import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { NextRoundDto } from "../../dto/body";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { NextRoundUseCase } from "./next-round.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import { RoundStatus, type GameState } from "../../../domain";
import { GAME_UPDATED } from "../../game.events";
import { PlayerNotRoomOwnerError } from "../../../domain/errors/game.errors";

describe("NextRoundUseCase (with Addon Pipeline & FIFO Queue) - TDD", () => {
	let useCase: NextRoundUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let repository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;

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
				{ id: "team-1", name: "Red", color: "#FF0000", score: 5 },
				{ id: "team-2", name: "Blue", color: "#0000FF", score: 0 },
			],
			players: [
				{
					id: ownerId,
					name: "Alice",
					teamId: "team-1",
					isReady: true,
				},
				{ id: "p2", name: "Bob", teamId: "team-1", isReady: true },
				{ id: "p3", name: "Charlie", teamId: "team-2", isReady: true },
			],
			bannedPlayerIds: [],
			activeTeamId: "team-1",
			currentRound: {
				id: "r-1",
				explainerId: ownerId,
				teamId: "team-1",
				status: RoundStatus.FINISHED,
				currentWord: null,
				words: [{ id: "w-1", text: "SUN", score: 1 }],
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

		repository = {
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

		useCase = new NextRoundUseCase(
			fifoQueue,
			gameSharedService,
			repository,
			eventEmitter,
		);
	});

	it("successfully advances active team cyclically, creates next round in PENDING, saves and emits GAME_UPDATED", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: NextRoundDto = { roomId };
		await useCase.execute(dto, actorOwner);

		// Active team advanced to team-2
		expect(engine.getState().activeTeamId).toBe("team-2");

		// New round created
		const newRound = engine.getState().currentRound;
		expect(newRound).toBeDefined();
		expect(newRound?.roundNumber).toBe(2);
		expect(newRound?.teamId).toBe("team-2");
		expect(newRound?.explainerId).toBe("p3"); // Charlie from team-2
		expect(newRound?.status).toBe(RoundStatus.PENDING);
		expect(newRound?.words).toEqual([]);
		expect(newRound?.currentWord).toBeNull();

		// State saved
		expect(repository.saveGame).toHaveBeenCalledWith(engine);

		// GAME_UPDATED emitted
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			GAME_UPDATED,
			expect.objectContaining({
				room: expect.objectContaining({
					id: roomId,
					activeTeamId: "team-2",
				}),
			}),
		);
	});

	it("throws PlayerNotRoomOwnerError if actor is not the owner", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const notOwner: UserDto = {
			id: "not-owner",
			name: "Dave",
			role: "registered",
		};

		const dto: NextRoundDto = { roomId };
		await expect(useCase.execute(dto, notOwner)).rejects.toThrow(
			PlayerNotRoomOwnerError,
		);
		expect(repository.saveGame).not.toHaveBeenCalled();
	});

	it("throws error if previous round was not FINISHED", async () => {
		const engine = createTestEngine({
			currentRound: {
				id: "r-1",
				explainerId: ownerId,
				teamId: "team-1",
				status: RoundStatus.IN_PROGRESS,
				currentWord: { id: "w-1", text: "SUN", score: 0 },
				words: [],
				roundNumber: 1,
				expiresAt: 100,
			},
		});
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: NextRoundDto = { roomId };
		await expect(useCase.execute(dto, actorOwner)).rejects.toThrow(
			"Previous round must be FINISHED before starting a new round",
		);
	});
});
