import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { BuyItemDto } from "../../dto/body";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { BuyItemUseCase } from "./buy-item.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import {
	RoundStatus,
	type GameState,
	type EffectItemId,
} from "../../../domain";
import { GAME_UPDATED } from "../../game.events";
import {
	EconomyService,
	InsufficientFundsError,
} from "../../../domain/economy";
import { ShopService, ShopDisabledError } from "../../../domain/shop";

describe("BuyItemUseCase - Strict TDD", () => {
	let useCase: BuyItemUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let gameRepository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;

	const roomId = "room-shop-123";
	const playerId = "player-1";
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
		const engine = GameEngine.fromPrimitives(state);
		// Give player some coins
		EconomyService.deposit(engine.getState(), playerId, 100, "initial");
		return engine;
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

		useCase = new BuyItemUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
		);
	});

	it("successfully buys an item, updates wallet, adds item to inventory and emits GAME_UPDATED", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: BuyItemDto = {
			roomId,
			itemId: "DOUBLE_POINTS" as EffectItemId,
		};

		const result = await useCase.execute(dto, actor);

		expect(gameSharedService.loadGame).toHaveBeenCalledWith(roomId);
		expect(gameRepository.saveGame).toHaveBeenCalled();
		expect(eventEmitter.emit).toHaveBeenCalledWith(GAME_UPDATED, {
			room: expect.objectContaining({ id: roomId }),
		});

		// Inventory should have 1 item
		const inventory = ShopService.getInventory(engine.getState(), playerId);
		expect(inventory).toHaveLength(1);
		expect(inventory[0]?.itemId).toBe("DOUBLE_POINTS");

		// Coins deducted
		const balance = EconomyService.getBalance(engine.getState(), playerId);
		expect(balance).toBeLessThan(100);
		expect(result).toBeDefined();
	});

	it("throws InsufficientFundsError when player cannot afford the item", async () => {
		const engine = createTestEngine();
		// Empty the player's wallet
		EconomyService.withdraw(engine.getState(), playerId, 100, "empty");
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: BuyItemDto = {
			roomId,
			itemId: "DOUBLE_POINTS" as EffectItemId,
		};

		await expect(useCase.execute(dto, actor)).rejects.toThrow(
			InsufficientFundsError,
		);
	});

	it("throws ShopDisabledError when shop is disabled in settings", async () => {
		const engine = createTestEngine({
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
				isShopEnabled: false,
			},
		});
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: BuyItemDto = {
			roomId,
			itemId: "DOUBLE_POINTS" as EffectItemId,
		};

		await expect(useCase.execute(dto, actor)).rejects.toThrow(
			ShopDisabledError,
		);
	});
});
