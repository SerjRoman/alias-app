import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { PauseGameDto } from "../../dto/body";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import type { RoundScheduler } from "../../round-scheduler.service";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { PauseRoundUseCase } from "./pause-round.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import { RoundStatus, type GameState } from "../../../domain";
import { ROUND_UPDATED, GAME_UPDATED } from "../../game.events";

describe("PauseRoundUseCase - Strict TDD", () => {
	let useCase: PauseRoundUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let gameRepository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;
	let roundScheduler: jest.Mocked<RoundScheduler>;

	const roomId = "room-pause-123";
	const ownerId = "owner-1";
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
					id: ownerId,
					name: "Alice",
					teamId: "team-1",
					isReady: true,
				},
			],
			bannedPlayerIds: [],
			activeTeamId: "team-1",
			currentRound: {
				id: "r-1",
				explainerId: ownerId,
				teamId: "team-1",
				status: RoundStatus.IN_PROGRESS,
				currentWord: { id: "w-1", text: "PLANET", score: 0 },
				words: [],
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
		} as unknown as jest.Mocked<IGameRepository>;

		eventEmitter = {
			emit: jest.fn(),
		} as unknown as jest.Mocked<EventEmitter2>;

		roundScheduler = {
			pauseAll: jest.fn().mockReturnValue(new Map([["round", 30000]])),
		} as unknown as jest.Mocked<RoundScheduler>;

		useCase = new PauseRoundUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
			roundScheduler,
		);
	});

	it("pauses the round, pauses timers in scheduler and emits notifications", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: PauseGameDto = { roomId };
		const result = await useCase.execute(dto, actor);

		expect(gameSharedService.loadGame).toHaveBeenCalledWith(roomId);
		expect(gameRepository.saveGame).toHaveBeenCalled();
		expect(roundScheduler.pauseAll).toHaveBeenCalledWith(roomId);

		// Current round must be paused
		const roundState = engine.getState().currentRound;
		expect(roundState?.pausedAt).toBeDefined();
		expect(roundState?.remainingMs).toBeDefined();

		// Notifications emitted
		expect(eventEmitter.emit).toHaveBeenCalledWith(GAME_UPDATED, {
			room: expect.objectContaining({ id: roomId }),
		});
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			ROUND_UPDATED,
			expect.objectContaining({ roomId }),
		);
		expect(result).toBeDefined();
	});
});
