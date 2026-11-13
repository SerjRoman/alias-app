import { ShopService } from "./shop.service";
import type { GameState } from "../state/game.state";
import { ItemNotInInventoryError } from "./shop.types";

describe("ShopService", () => {
	const createMockState = (): GameState => ({
		id: "room-1",
		ownerId: "user-1",
		status: "IN_PROGRESS",
		pointsToWin: 30,
		teams: [],
		players: [],
		bannedPlayerIds: [],
		activeTeamId: null,
		currentRound: null,
		activeEffects: [],
		addons: {},
	});

	describe("Inventory operations", () => {
		it("initializes empty inventory and retrieves it", () => {
			const state = createMockState();
			expect(ShopService.getInventory(state, "p1")).toEqual([]);
		});

		it("adds items to inventory and retrieves them", () => {
			const state = createMockState();
			ShopService.addItem(state, "p1", {
				id: "inv-1",
				itemId: "DOUBLE_POINTS",
				purchasedAt: 1000,
			});

			const inv = ShopService.getInventory(state, "p1");
			expect(inv).toHaveLength(1);
			expect(inv[0].id).toBe("inv-1");
		});

		it("removes items from inventory and returns the removed item", () => {
			const state = createMockState();
			ShopService.addItem(state, "p1", {
				id: "inv-1",
				itemId: "DOUBLE_POINTS",
				purchasedAt: 1000,
			});

			const removed = ShopService.removeItem(state, "p1", "inv-1");
			expect(removed.id).toBe("inv-1");
			expect(ShopService.getInventory(state, "p1")).toHaveLength(0);
		});

		it("throws ItemNotInInventoryError if trying to remove non-existent item", () => {
			const state = createMockState();
			expect(() =>
				ShopService.removeItem(state, "p1", "inv-ghost"),
			).toThrow(ItemNotInInventoryError);
		});
	});

	describe("getAvailableCatalog", () => {
		it("returns empty array if isShopEnabled is false", () => {
			const catalog = ShopService.getAvailableCatalog({
				isShopEnabled: false,
			});
			expect(catalog).toEqual([]);
		});

		it("returns all 10 items when isVoiceChatEnabled is true (or undefined)", () => {
			const catalog = ShopService.getAvailableCatalog({
				isVoiceChatEnabled: true,
			});
			expect(catalog).toHaveLength(10);
			expect(catalog.some((i) => i.id === "VOICE_MUTE")).toBe(true);
		});

		it("excludes VOICE_MUTE when isVoiceChatEnabled is false", () => {
			const catalog = ShopService.getAvailableCatalog({
				isVoiceChatEnabled: false,
			});
			expect(catalog).toHaveLength(9);
			expect(catalog.some((i) => i.id === "VOICE_MUTE")).toBe(false);
		});
	});
});
