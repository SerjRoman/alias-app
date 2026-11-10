import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { ChangeWordScoreDto } from "../../dto/body";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { ChangeWordScoreUseCase } from "./change-word-score.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import { RoundStatus, type GameState } from "../../../domain";
import { ROUND_UPDATED } from "../../game.events";
import { RoundNotActiveError } from "../../../domain/errors/round.errors";

describe("ChangeWordScoreUseCase (with Addon Pipeline & FIFO Queue) - TDD", () => {
	let useCase: ChangeWordScoreUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let gameRepository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;

	const roomId = "room-123";
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
				{ id: "team-1", name: "Red", color: "#FF0000", score: 10 },
				{ id: "team-2", name: "Blue", color: "#0000FF", score: 5 },
			],
			players: [
				{
					id: "p1",
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
				explainerId: "p1",
				teamId: "team-1",
				status: RoundStatus.POINTING,
				currentWord: null,
				words: [
					{ id: "w-1", text: "SUN", score: 1 },
					{ id: "w-2", text: "MOON", score: 0 },
				],
				roundNumber: 1,
				endTime: 100,
			},
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

		useCase = new ChangeWordScoreUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
		);
	});

	it("successfully updates word score, adjusts team score, saves game, and emits ROUND_UPDATED", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: ChangeWordScoreDto = {
			roomId,
			wordId: "w-2",
			delta: 1,
		};
		await useCase.execute(dto, actor);

		// Word score changed from 0 to 1
		const words = engine.getState().currentRound?.words;
		expect(words?.[1].score).toBe(1);

		// Team score increased from 10 to 11
		expect(engine.getState().teams[0].score).toBe(11);

		// State was saved
		expect(gameRepository.saveGame).toHaveBeenCalledWith(engine);

		// ROUND_UPDATED was emitted
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
	});

	it("throws RoundNotActiveError if currentRound is null", async () => {
		const engine = createTestEngine({ currentRound: null });
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: ChangeWordScoreDto = {
			roomId,
			wordId: "w-1",
			delta: 1,
		};
		await expect(useCase.execute(dto, actor)).rejects.toThrow(
			RoundNotActiveError,
		);
		expect(gameRepository.saveGame).not.toHaveBeenCalled();
	});

	it("throws error if round is not in POINTING status", async () => {
		const engine = createTestEngine({
			currentRound: {
				id: "r-1",
				explainerId: "p1",
				teamId: "team-1",
				status: RoundStatus.IN_PROGRESS,
				currentWord: { id: "w-1", text: "SUN", score: 0 },
				words: [],
				roundNumber: 1,
				endTime: 100,
			},
		});
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: ChangeWordScoreDto = {
			roomId,
			wordId: "w-1",
			delta: 1,
		};
		await expect(useCase.execute(dto, actor)).rejects.toThrow(
			"Word score can only be changed during POINTING phase",
		);
	});

	it("handles concurrent word score changes sequentially through FIFO queue", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		// w-2 has initial score 0. We execute +1 twice concurrently.
		// Since score is clamped to 1, first +1 makes it 1 (diff +1), second +1 makes it 1 (diff 0).
		await Promise.all([
			useCase.execute({ roomId, wordId: "w-2", delta: 1 }, actor),
			useCase.execute({ roomId, wordId: "w-2", delta: 1 }, actor),
		]);

		const words = engine.getState().currentRound?.words;
		expect(words?.[1].score).toBe(1);
		expect(engine.getState().teams[0].score).toBe(11);
	});
});
