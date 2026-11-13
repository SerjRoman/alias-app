import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { StartRoundDto } from "../../dto/body";
import type { DictionaryService } from "../../dictionary.service";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import type { RoundScheduler } from "../../round-scheduler.service";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { StartRoundUseCase } from "./start-round.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import { RoundStatus, type GameState, type WordItem } from "../../../domain";
import { ROUND_UPDATED } from "../../game.events";
import { RoundNotActiveError } from "../../../domain/errors/round.errors";
import { GameError } from "../../../domain/errors/game.errors";

describe("StartRoundUseCase (with Addon Pipeline & FIFO Queue) - TDD", () => {
	let useCase: StartRoundUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let gameRepository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;
	let roundScheduler: jest.Mocked<RoundScheduler>;
	let dictionaryService: jest.Mocked<DictionaryService>;

	const roomId = "room-123";
	const explainerId = "explainer-1";
	const ownerId = "owner-1";

	const actorExplainer: UserDto = {
		id: explainerId,
		name: "Alice",
		role: "registered",
	};

	const createTestEngine = (overrides?: Partial<GameState>): GameEngine => {
		const state: GameState = {
			id: roomId,
			ownerId,
			status: "IN_PROGRESS",
			pointsToWin: 30,
			roundTimeSeconds: 60,
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
				status: RoundStatus.PENDING,
				currentWord: null,
				words: [],
				roundNumber: 1,
				expiresAt: 0,
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

		dictionaryService = {
			popWordForGame: jest.fn(),
		} as unknown as jest.Mocked<DictionaryService>;

		useCase = new StartRoundUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
			roundScheduler,
			dictionaryService,
		);
	});

	it("successfully starts round: pops word, dispatches START_ROUND, schedules timeout, saves, and emits event", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);
		dictionaryService.popWordForGame.mockResolvedValue("TELESCOPE");

		const dto: StartRoundDto = { roomId };
		const result = await useCase.execute(dto, actorExplainer);

		// Verified that first word was popped from dictionary
		expect(dictionaryService.popWordForGame).toHaveBeenCalledWith(roomId);

		// Verified that round state changed to IN_PROGRESS
		const state = engine.getState();
		expect(state.currentRound?.status).toBe(RoundStatus.IN_PROGRESS);
		expect(state.currentRound?.currentWord).toEqual({
			id: expect.any(String),
			text: "TELESCOPE",
			score: 0,
		} as WordItem);

		// Verified that roundScheduler scheduled timeout with 60000ms
		expect(roundScheduler.scheduleRoundTimeout).toHaveBeenCalledWith(
			roomId,
			60000,
			expect.any(Function),
		);

		// Verified that game state was saved
		expect(gameRepository.saveGame).toHaveBeenCalledWith(engine);

		// Verified that ROUND_UPDATED event was emitted
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			ROUND_UPDATED,
			expect.objectContaining({
				roomId,
				round: expect.objectContaining({
					id: "r-1",
					status: RoundStatus.IN_PROGRESS,
				}),
			}),
		);

		// Verified result
		expect(result.word?.text).toBe("TELESCOPE");
	});

	it("throws RoundNotActiveError when currentRound is null", async () => {
		const engine = createTestEngine({ currentRound: null });
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: StartRoundDto = { roomId };
		await expect(useCase.execute(dto, actorExplainer)).rejects.toThrow(
			RoundNotActiveError,
		);
		expect(dictionaryService.popWordForGame).not.toHaveBeenCalled();
		expect(gameRepository.saveGame).not.toHaveBeenCalled();
	});

	it("throws GameError when dictionary has no words available", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);
		dictionaryService.popWordForGame.mockResolvedValue(
			null as unknown as string,
		);

		const dto: StartRoundDto = { roomId };
		await expect(useCase.execute(dto, actorExplainer)).rejects.toThrow(
			GameError,
		);
		expect(roundScheduler.scheduleRoundTimeout).not.toHaveBeenCalled();
		expect(gameRepository.saveGame).not.toHaveBeenCalled();
	});

	it("throws error when actor is neither explainer nor owner", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);
		dictionaryService.popWordForGame.mockResolvedValue("PLANET");

		const impostor: UserDto = {
			id: "intruder-99",
			name: "Eve",
			role: "registered",
		};

		const dto: StartRoundDto = { roomId };
		await expect(useCase.execute(dto, impostor)).rejects.toThrow(
			"Only the designated explainer or room owner can start the round",
		);
		expect(dictionaryService.popWordForGame).not.toHaveBeenCalled();
		expect(roundScheduler.scheduleRoundTimeout).not.toHaveBeenCalled();
	});

	it("executes timeout callback properly to transition to POINTING phase", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);
		dictionaryService.popWordForGame.mockResolvedValue("SATELLITE");

		let timeoutCallback: (() => Promise<void>) | undefined;
		roundScheduler.scheduleRoundTimeout.mockImplementation(
			(_rId, _ms, cb) => {
				timeoutCallback = cb as () => Promise<void>;
				return {} as never;
			},
		);

		const dto: StartRoundDto = { roomId };
		await useCase.execute(dto, actorExplainer);

		expect(timeoutCallback).toBeDefined();

		// Trigger the scheduled timeout callback
		if (timeoutCallback) {
			await timeoutCallback();
		}

		// State should now be transitioned to POINTING
		expect(engine.getState().currentRound?.status).toBe(
			RoundStatus.POINTING,
		);
		// SATELLITE moved to words history with score 0
		expect(engine.getState().currentRound?.words).toHaveLength(1);
		expect(engine.getState().currentRound?.words[0].text).toBe("SATELLITE");
		expect(engine.getState().currentRound?.words[0].score).toBe(0);

		// Saved again and emitted ROUND_UPDATED
		expect(gameRepository.saveGame).toHaveBeenCalledTimes(2);
		expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
	});
});
