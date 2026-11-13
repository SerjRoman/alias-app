import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { GetShopCatalogUseCase } from "./get-shop-catalog.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import type { GameState } from "../../../domain";
import { MAX_INVENTORY_SIZE, SHOP_CATALOG } from "../../../domain/shop/shop.types";

describe("GetShopCatalogUseCase", () => {
	let useCase: GetShopCatalogUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let gameRepository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;

	const roomId = "room-shop-catalog-123";
	const actor: UserDto = {
		id: "player-1",
		name: "Alice",
		role: "registered",
	};

	const createTestEngine = (overrides?: Partial<GameState["settings"]>): GameEngine => {
		const state: GameState = {
			id: roomId,
			ownerId: "player-1",
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
				...overrides,
			},
			teams: [
				{ id: "team-1", name: "Red", color: "#FF0000", score: 5 },
				{ id: "team-2", name: "Blue", color: "#0000FF", score: 0 },
			],
			players: [
				{
					id: "player-1",
					name: "Alice",
					role: "player",
					teamId: "team-1",
					isReady: true,
					isOnline: true,
				},
			],
			currentRound: null,
			rounds: [],
			activeEffects: [],
		};

		return new GameEngine(state);
	};

	beforeEach(() => {
		fifoQueue = new RoomFifoQueueService();
		gameRepository = {
			saveGame: jest.fn().mockResolvedValue(undefined),
			findGameById: jest.fn(),
		} as unknown as jest.Mocked<IGameRepository>;

		eventEmitter = {
			emit: jest.fn(),
		} as unknown as jest.Mocked<EventEmitter2>;

		const engine = createTestEngine();
		gameSharedService = {
			loadGame: jest.fn().mockResolvedValue(engine),
		} as unknown as jest.Mocked<GameSharedService>;

		useCase = new GetShopCatalogUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
		);
	});

	it("returns all items with isAvailable: true when shop and voice chat are enabled", async () => {
		const result = await useCase.execute({ roomId }, actor);

		expect(result.isShopEnabled).toBe(true);
		expect(result.maxInventorySize).toBe(MAX_INVENTORY_SIZE);
		expect(result.items).toHaveLength(SHOP_CATALOG.length);

		for (const item of result.items) {
			expect(item.isAvailable).toBe(true);
		}
		expect(gameRepository.saveGame).not.toHaveBeenCalled();
	});

	it("marks VOICE_MUTE as unavailable when isVoiceChatEnabled is false", async () => {
		const engine = createTestEngine({ isVoiceChatEnabled: false });
		gameSharedService.loadGame.mockResolvedValue(engine);

		const result = await useCase.execute({ roomId }, actor);

		expect(result.isShopEnabled).toBe(true);
		const voiceMuteItem = result.items.find((it) => it.id === "VOICE_MUTE");
		expect(voiceMuteItem).toBeDefined();
		expect(voiceMuteItem?.isAvailable).toBe(false);

		const doublePointsItem = result.items.find((it) => it.id === "DOUBLE_POINTS");
		expect(doublePointsItem?.isAvailable).toBe(true);
	});

	it("marks all items as unavailable when isShopEnabled is false", async () => {
		const engine = createTestEngine({ isShopEnabled: false });
		gameSharedService.loadGame.mockResolvedValue(engine);

		const result = await useCase.execute({ roomId }, actor);

		expect(result.isShopEnabled).toBe(false);
		for (const item of result.items) {
			expect(item.isAvailable).toBe(false);
		}
	});
});
