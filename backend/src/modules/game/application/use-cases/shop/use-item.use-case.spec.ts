import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { UseItemDto } from "../../dto/body";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import type { RoundScheduler } from "../../round-scheduler.service";
import type { DictionaryService } from "../../dictionary.service";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { UseItemUseCase } from "./use-item.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import {
	RoundStatus,
	type GameState,
	EffectExpiredDomainEvent,
} from "../../../domain";
import { GAME_UPDATED } from "../../game.events";
import { ShopService, ItemNotInInventoryError } from "../../../domain/shop";

describe("UseItemUseCase - Strict TDD", () => {
	let useCase: UseItemUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let gameRepository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;
	let roundScheduler: jest.Mocked<RoundScheduler>;
	let dictionaryService: jest.Mocked<DictionaryService>;

	const roomId = "room-use-item-123";
	const playerId = "player-1";
	const enemyId = "player-2";
	const actor: UserDto = {
		id: playerId,
		name: "Alice",
		role: "registered",
	};

	const createTestEngine = (overrides?: Partial<GameState>): GameEngine => {
		const state: GameState = {
			id: roomId,
			ownerId: playerId,
			status: "IN_PROGRESS",
			pointsToWin: 30,
			settings: {
				name: "Test Room",
				roundTimeSeconds: 60,
				pointsToWin: 30,
				code: null,
				isPrivate: false,
				wordPackSelections: [],
				wordsPerPlayer: 5,
				isHatMode: false,
				isOnlyOwnerCanNextRound: false,
				isOnlyOwnerCanChangeScore: false,
				isVoiceChatEnabled: true,
				isShopEnabled: true,
			},
			teams: [
				{ id: "team-1", name: "Red", color: "#FF0000", score: 5 },
				{ id: "team-2", name: "Blue", color: "#0000FF", score: 0 },
			],
			players: [
				{
					id: playerId,
					name: "Alice",
					teamId: "team-1",
					isReady: true,
				},
				{
					id: enemyId,
					name: "Bob",
					teamId: "team-2",
					isReady: true,
				},
			],
			bannedPlayerIds: [],
			activeTeamId: "team-1",
			currentRound: {
				id: "r-1",
				explainerId: playerId,
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
			scheduleEffectTimeout: jest.fn(),
			clearEffectTimeout: jest.fn(),
			changeRoundTime: jest.fn(),
		} as unknown as jest.Mocked<RoundScheduler>;

		dictionaryService = {
			popWordForGame: jest.fn().mockResolvedValue("GALAXY"),
		} as unknown as jest.Mocked<DictionaryService>;

		useCase = new UseItemUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
			roundScheduler,
			dictionaryService,
		);
	});

	it("uses round-based item, removes it from inventory, adds active effect and emits GAME_UPDATED", async () => {
		const engine = createTestEngine();
		ShopService.addItem(engine.getState(), playerId, {
			id: "inv-dp-1",
			itemId: "DOUBLE_POINTS",
			purchasedAt: Date.now(),
		});

		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: UseItemDto = {
			roomId,
			inventoryItemId: "inv-dp-1",
			targetTeamId: "team-1",
		};

		const result = await useCase.execute(dto, actor);

		expect(gameSharedService.loadGame).toHaveBeenCalledWith(roomId);
		expect(gameRepository.saveGame).toHaveBeenCalled();
		expect(eventEmitter.emit).toHaveBeenCalledWith(GAME_UPDATED, {
			room: expect.objectContaining({ id: roomId }),
		});

		// Removed from inventory
		const inv = ShopService.getInventory(engine.getState(), playerId);
		expect(inv).toHaveLength(0);

		// Active effect added
		expect(engine.getState().activeEffects).toHaveLength(1);
		expect(engine.getState().activeEffects[0]?.itemId).toBe(
			"DOUBLE_POINTS",
		);

		// No timed scheduler scheduled
		expect(roundScheduler.scheduleEffectTimeout).not.toHaveBeenCalled();
		expect(result).toBeDefined();
	});

	it("uses timed item (VOICE_MUTE), schedules expiration in RoundScheduler and calls domain expireEffect on timeout", async () => {
		const engine = createTestEngine();
		ShopService.addItem(engine.getState(), playerId, {
			id: "inv-mute-1",
			itemId: "VOICE_MUTE",
			purchasedAt: Date.now(),
		});

		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: UseItemDto = {
			roomId,
			inventoryItemId: "inv-mute-1",
			targetPlayerId: enemyId,
		};

		await useCase.execute(dto, actor);

		// Scheduler should have been called
		expect(roundScheduler.scheduleEffectTimeout).toHaveBeenCalledWith(
			roomId,
			expect.any(String),
			expect.any(Number),
			expect.any(Function),
		);

		// The effect is currently active
		const activeEffects = engine.getState().activeEffects;
		expect(activeEffects).toHaveLength(1);
		const effectId = activeEffects[0]?.id ?? "";
		expect(effectId).toBeTruthy();

		// Simulate timer firing
		const calls = roundScheduler.scheduleEffectTimeout.mock.calls;
		const scheduledCallback = calls[0]?.[3];
		expect(scheduledCallback).toBeDefined();
		if (scheduledCallback) {
			await Promise.resolve(scheduledCallback());
		}

		// When timer fired, engine.expireEffect was called, so effect is removed
		expect(engine.getState().activeEffects).toHaveLength(0);
		expect(gameRepository.saveGame).toHaveBeenCalledWith(engine);

		// Domain event was added to engine
		const events = engine.pullDomainEvents();
		expect(
			events.some(
				(e) =>
					e instanceof EffectExpiredDomainEvent &&
					e.effectId === effectId,
			),
		).toBe(true);
	});

	it("throws ItemNotInInventoryError if item does not exist in inventory", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: UseItemDto = {
			roomId,
			inventoryItemId: "non-existent-item",
		};

		await expect(useCase.execute(dto, actor)).rejects.toThrow(
			ItemNotInInventoryError,
		);
	});

	it("uses EXTRA_TIME and reschedules round timer via RoundScheduler.changeRoundTime", async () => {
		const engine = createTestEngine();
		ShopService.addItem(engine.getState(), playerId, {
			id: "inv-extra-1",
			itemId: "EXTRA_TIME",
			purchasedAt: Date.now(),
		});
		gameSharedService.loadGame.mockResolvedValue(engine);

		await useCase.execute(
			{ roomId, inventoryItemId: "inv-extra-1" },
			actor,
		);

		expect(roundScheduler.changeRoundTime).toHaveBeenCalledWith(
			roomId,
			10_000,
		);
	});

	it("uses CLEANSE and clears scheduled effect timeouts for cleansed debuffs", async () => {
		const engine = createTestEngine({
			activeEffects: [
				{
					id: "eff-flip-1",
					itemId: "FLIP_WORD",
					sourcePlayerId: enemyId,
					targetPlayerId: playerId,
					status: "ACTIVE",
					expiresAt: Date.now() + 8_000,
				},
			],
		});
		ShopService.addItem(engine.getState(), playerId, {
			id: "inv-cleanse-1",
			itemId: "CLEANSE",
			purchasedAt: Date.now(),
		});
		gameSharedService.loadGame.mockResolvedValue(engine);

		await useCase.execute(
			{ roomId, inventoryItemId: "inv-cleanse-1" },
			actor,
		);

		expect(roundScheduler.clearEffectTimeout).toHaveBeenCalledWith(
			roomId,
			"eff-flip-1",
		);
	});

	it("uses REROLL_WORD, pops new word from DictionaryService, and replaces currentWord", async () => {
		const engine = createTestEngine();
		ShopService.addItem(engine.getState(), playerId, {
			id: "inv-reroll-1",
			itemId: "REROLL_WORD",
			purchasedAt: Date.now(),
		});
		gameSharedService.loadGame.mockResolvedValue(engine);

		const result = await useCase.execute(
			{ roomId, inventoryItemId: "inv-reroll-1" },
			actor,
		);

		expect(dictionaryService.popWordForGame).toHaveBeenCalledWith(roomId);
		expect(result.currentRound?.currentWord?.text).toBe("GALAXY");
	});
});
