import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { ResumeGameDto } from "../../dto/body";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import type { RoundScheduler } from "../../round-scheduler.service";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { ResumeRoundUseCase } from "./resume-round.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import { RoundStatus, type GameState } from "../../../domain";
import { ROUND_UPDATED, GAME_UPDATED } from "../../game.events";

describe("ResumeRoundUseCase - Strict TDD", () => {
	let useCase: ResumeRoundUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let gameRepository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;
	let roundScheduler: jest.Mocked<RoundScheduler>;

	const roomId = "room-resume-123";
	const ownerId = "owner-1";
	const actor: UserDto = {
		id: ownerId,
		name: "Alice",
		role: "registered",
	};

	const createPausedEngine = (): GameEngine => {
		const now = Date.now();
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
				expiresAt: now + 30000,
				durationMs: 30000,
				pausedAt: now - 5000,
				remainingMs: 25000,
			},
			activeEffects: [],
			addons: {},
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
			resumeAll: jest.fn(),
		} as unknown as jest.Mocked<RoundScheduler>;

		useCase = new ResumeRoundUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
			roundScheduler,
		);
	});

	it("resumes the round, resumes timers in scheduler and emits notifications", async () => {
		const engine = createPausedEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: ResumeGameDto = { roomId };
		const result = await useCase.execute(dto, actor);

		expect(gameSharedService.loadGame).toHaveBeenCalledWith(roomId);
		expect(gameRepository.saveGame).toHaveBeenCalled();
		expect(roundScheduler.resumeAll).toHaveBeenCalledWith(roomId);

		// Current round must be resumed
		const roundState = engine.getState().currentRound;
		expect(roundState?.pausedAt).toBeNull();
		expect(roundState?.remainingMs).toBeNull();

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
