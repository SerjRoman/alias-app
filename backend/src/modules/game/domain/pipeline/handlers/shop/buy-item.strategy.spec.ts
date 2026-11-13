import { BuyItemStrategy } from "./buy-item.strategy";
import { EconomyService } from "../../../economy";
import { ShopService } from "../../../shop/shop.service";
import {
	ShopDisabledError,
	ShopItemNotFoundError,
	ShopItemDisabledError,
	InventoryFullError,
	InvalidEffectTargetError,
} from "../../../shop/shop.types";
import {
	GameNotInProgressError,
	PlayerNotFoundError,
} from "../../../errors/game.errors";
import { InsufficientFundsError } from "../../../economy/economy.types";
import { ItemPurchasedDomainEvent } from "../../../events/game.events";
import type { GameState } from "../../../state/game.state";
import type { BuyItemAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";

describe("BuyItemStrategy", () => {
	const createMockState = (
		overrides: Partial<GameState> = {},
	): GameState => ({
		id: "room-1",
		ownerId: "user-1",
		status: "IN_PROGRESS",
		pointsToWin: 30,
		settings: {
			name: "Test Room",
			roundTimeSeconds: 60,
			pointsToWin: 30,
			code: null,
			isPrivate: false,
			wordPackSelections: [],
			wordsPerPlayer: 0,
			isHatMode: false,
			isOnlyOwnerCanNextRound: false,
			isOnlyOwnerCanChangeScore: false,
			isVoiceChatEnabled: true,
			isShopEnabled: true,
		},
		teams: [
			{
				id: "team-1",
				name: "Red",
				color: "#FF0000",
				score: 0,
				playerIds: ["user-1"],
			},
		],
		players: [
			{
				id: "user-1",
				name: "Alice",
				role: "registered",
				isReady: true,
				isRoundReady: false,
				isOnline: true,
				teamId: "team-1",
			},
		],
		bannedPlayerIds: [],
		activeTeamId: "team-1",
		currentRound: null,
		activeEffects: [],
		addons: {},
		...overrides,
	});

	const createMockContext = (
		state: GameState,
		action: BuyItemAction,
	): ActionContext => ({
		action,
		state,
		emit: jest.fn(),
		now: 1500,
	});

	it("successfully buys an item, withdraws coins and adds to player inventory", () => {
		const strategy = new BuyItemStrategy();
		const state = createMockState();
		EconomyService.deposit(state, "user-1", 20, "test_seed", 1000);

		const action: BuyItemAction = {
			type: "BUY_ITEM",
			actorId: "user-1",
			payload: { itemId: "DOUBLE_POINTS" },
		};
		const ctx = createMockContext(state, action);

		strategy.handle(action, ctx);

		expect(EconomyService.getBalance(state, "user-1")).toBe(10);
		const inventory = ShopService.getInventory(state, "user-1");
		expect(inventory).toHaveLength(1);
		expect(inventory[0]?.itemId).toBe("DOUBLE_POINTS");
		expect(inventory[0]?.purchasedAt).toBe(1500);

		expect(ctx.emit).toHaveBeenCalledWith(
			expect.any(ItemPurchasedDomainEvent),
		);
		expect(ctx.emit).toHaveBeenCalledWith(
			expect.objectContaining({
				roomId: "room-1",
				playerId: "user-1",
				itemId: "DOUBLE_POINTS",
				cost: 10,
				remainingBalance: 10,
			}),
		);
	});

	it("throws ShopDisabledError if isShopEnabled is false in settings", () => {
		const strategy = new BuyItemStrategy();
		const state = createMockState({
			settings: {
				...createMockState().settings,
				isShopEnabled: false,
			},
		});
		EconomyService.deposit(state, "user-1", 50, "seed");

		const action: BuyItemAction = {
			type: "BUY_ITEM",
			actorId: "user-1",
			payload: { itemId: "DOUBLE_POINTS" },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(ShopDisabledError);
	});

	it("throws GameNotInProgressError if game is in LOBBY", () => {
		const strategy = new BuyItemStrategy();
		const state = createMockState({ status: "LOBBY" });

		const action: BuyItemAction = {
			type: "BUY_ITEM",
			actorId: "user-1",
			payload: { itemId: "DOUBLE_POINTS" },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(
			GameNotInProgressError,
		);
	});

	it("throws PlayerNotFoundError if actorId is not in game", () => {
		const strategy = new BuyItemStrategy();
		const state = createMockState();

		const action: BuyItemAction = {
			type: "BUY_ITEM",
			actorId: "unknown-user",
			payload: { itemId: "DOUBLE_POINTS" },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(PlayerNotFoundError);
	});

	it("throws ShopItemNotFoundError if itemId is invalid", () => {
		const strategy = new BuyItemStrategy();
		const state = createMockState();
		EconomyService.deposit(state, "user-1", 50, "seed");

		const action: BuyItemAction = {
			type: "BUY_ITEM",
			actorId: "user-1",
			payload: { itemId: "NON_EXISTING_ITEM" as unknown as any },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(
			ShopItemNotFoundError,
		);
	});

	it("throws ShopItemDisabledError if item requires voice chat but it is disabled", () => {
		const strategy = new BuyItemStrategy();
		const state = createMockState({
			settings: {
				...createMockState().settings,
				isVoiceChatEnabled: false,
			},
		});
		EconomyService.deposit(state, "user-1", 50, "seed");

		const action: BuyItemAction = {
			type: "BUY_ITEM",
			actorId: "user-1",
			payload: { itemId: "VOICE_MUTE" },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(
			ShopItemDisabledError,
		);
	});

	it("throws InventoryFullError if player already has maximum (3) items", () => {
		const strategy = new BuyItemStrategy();
		const state = createMockState();
		EconomyService.deposit(state, "user-1", 100, "seed");
		ShopService.addItem(state, "user-1", {
			id: "i-1",
			itemId: "DOUBLE_POINTS",
			purchasedAt: 1000,
		});
		ShopService.addItem(state, "user-1", {
			id: "i-2",
			itemId: "DOUBLE_POINTS",
			purchasedAt: 1000,
		});
		ShopService.addItem(state, "user-1", {
			id: "i-3",
			itemId: "DOUBLE_POINTS",
			purchasedAt: 1000,
		});

		const action: BuyItemAction = {
			type: "BUY_ITEM",
			actorId: "user-1",
			payload: { itemId: "DOUBLE_POINTS" },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(InventoryFullError);
	});

	it("throws InsufficientFundsError if player does not have enough coins", () => {
		const strategy = new BuyItemStrategy();
		const state = createMockState();
		EconomyService.deposit(state, "user-1", 5, "seed"); // DOUBLE_POINTS costs 10

		const action: BuyItemAction = {
			type: "BUY_ITEM",
			actorId: "user-1",
			payload: { itemId: "DOUBLE_POINTS" },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(
			InsufficientFundsError,
		);
	});

	it("throws InvalidEffectTargetError if actor is a spectator (no teamId)", () => {
		const strategy = new BuyItemStrategy();
		const state = createMockState();
		const spectator = state.players.find((p) => p.id === "user-1");
		if (spectator) {
			spectator.teamId = undefined;
		}
		EconomyService.deposit(state, "user-1", 50, "seed");

		const action: BuyItemAction = {
			type: "BUY_ITEM",
			actorId: "user-1",
			payload: { itemId: "DOUBLE_POINTS" },
		};
		const ctx = createMockContext(state, action);

		expect(() => strategy.handle(action, ctx)).toThrow(
			InvalidEffectTargetError,
		);
	});
});
