import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { NextWordDto } from "../../dto/body";
import type { DictionaryService } from "../../dictionary.service";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { NextWordUseCase } from "./next-word.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import { RoundStatus, type GameState } from "../../../domain";
import { ROUND_UPDATED } from "../../game.events";

describe("NextWordUseCase (with Addon Pipeline & FIFO Queue) - TDD", () => {
	let useCase: NextWordUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let gameRepository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;
	let dictionaryService: jest.Mocked<DictionaryService>;

	const roomId = "room-123";
	const explainerId = "explainer-1";
	const actor: UserDto = {
		id: explainerId,
		name: "Alice",
		role: "registered",
	};

	const createTestEngine = (overrides?: Partial<GameState>): GameEngine => {
		const state: GameState = {
			id: roomId,
			ownerId: "host-1",
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
				currentWord: { id: "w-current", text: "FOREST", score: 0 },
				words: [],
				roundNumber: 1,
				expiresAt: Date.now() + 60000,
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

		dictionaryService = {
			popWordForGame: jest.fn().mockResolvedValue("MOUNTAIN"),
		} as unknown as jest.Mocked<DictionaryService>;

		useCase = new NextWordUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
			dictionaryService,
		);
	});

	it("processes WORD_GUESSED sequentially through FIFO queue, updates score, and emits ROUND_UPDATED", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: NextWordDto = { roomId, wasSkipped: false };
		const result = await useCase.execute(dto, actor);

		// Verified that next word was fetched from dictionary
		expect(dictionaryService.popWordForGame).toHaveBeenCalledWith(roomId);

		// Verified that game state was saved to repository
		expect(gameRepository.saveGame).toHaveBeenCalledWith(engine);

		// Verified that active team score increased by 1 (5 + 1 = 6)
		expect(engine.getState().teams[0].score).toBe(6);

		// Verified that previous word was archived in round history
		expect(engine.getState().currentRound?.words).toHaveLength(1);
		expect(engine.getState().currentRound?.words[0].text).toBe("FOREST");
		expect(engine.getState().currentRound?.words[0].score).toBe(1);

		// Verified that new word was set
		expect(result.newWord).toBeDefined();
		expect(result.newWord?.text).toBe("MOUNTAIN");

		// Verified that ROUND_UPDATED event was emitted
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			ROUND_UPDATED,
			expect.objectContaining({ roomId }),
		);
	});

	it("processes WORD_SKIPPED with -1 penalty when wasSkipped is true", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: NextWordDto = { roomId, wasSkipped: true };
		const result = await useCase.execute(dto, actor);

		// Active team score reduced by 1 penalty (5 - 1 = 4)
		expect(engine.getState().teams[0].score).toBe(4);
		expect(engine.getState().currentRound?.words[0].score).toBe(-1);
		expect(result.newWord?.text).toBe("MOUNTAIN");
	});

	it("handles concurrent requests through FIFO queue without race conditions", async () => {
		const engine = createTestEngine();
		// Always return the current in-memory engine state
		gameSharedService.loadGame.mockResolvedValue(engine);

		dictionaryService.popWordForGame
			.mockResolvedValueOnce("WORD_1")
			.mockResolvedValueOnce("WORD_2")
			.mockResolvedValueOnce("WORD_3");

		// Execute 3 concurrent nextWord requests
		const [, , res3] = await Promise.all([
			useCase.execute({ roomId, wasSkipped: false }, actor),
			useCase.execute({ roomId, wasSkipped: false }, actor),
			useCase.execute({ roomId, wasSkipped: false }, actor),
		]);

		// All 3 words should be processed in order: 5 + 1 + 1 + 1 = 8
		expect(engine.getState().teams[0].score).toBe(8);
		expect(engine.getState().currentRound?.words).toHaveLength(3);
		expect(res3.newWord?.text).toBe("WORD_3");
	});

	it("does not pop word from dictionary if actor is not the explainer", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const impostor: UserDto = {
			id: "p2",
			name: "Bob",
			role: "registered",
		};

		await expect(
			useCase.execute({ roomId, wasSkipped: false }, impostor),
		).rejects.toThrow();

		expect(dictionaryService.popWordForGame).not.toHaveBeenCalled();
		expect(gameRepository.saveGame).not.toHaveBeenCalled();
	});

	it("does not pop word from dictionary if FREEZE_NEXT_WORD effect blocks the explainer", async () => {
		const engine = createTestEngine({
			activeEffects: [
				{
					id: "eff-freeze-1",
					itemId: "FREEZE_NEXT_WORD",
					sourcePlayerId: "p2",
					targetTeamId: "team-1",
					targetPlayerId: explainerId,
					status: "ACTIVE",
					expiresAt: Date.now() + 5000,
				},
			],
		});
		gameSharedService.loadGame.mockResolvedValue(engine);

		await expect(
			useCase.execute({ roomId, wasSkipped: false }, actor),
		).rejects.toThrow();

		expect(dictionaryService.popWordForGame).not.toHaveBeenCalled();
		expect(gameRepository.saveGame).not.toHaveBeenCalled();
	});
});
