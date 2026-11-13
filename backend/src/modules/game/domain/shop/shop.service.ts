import type { GameSettingsState, GameState } from "../state/game.state";
import {
	ItemNotInInventoryError,
	SHOP_CATALOG,
	type ShopCatalogItem,
	type ShopInventoryItem,
	type ShopSlice,
} from "./shop.types";

export class ShopService {
	public static readonly ADDON_KEY = "shop";

	public static getAvailableCatalog(
		settings?: GameSettingsState,
	): readonly ShopCatalogItem[] {
		if (settings?.isShopEnabled === false) {
			return [];
		}

		return SHOP_CATALOG.filter((item) => {
			if (item.requiresSetting) {
				const isEnabled = settings?.[item.requiresSetting];
				return isEnabled !== false;
			}
			return true;
		});
	}

	public static getSlice(state: GameState): ShopSlice {
		state.addons ??= {};
		if (!state.addons.shop) {
			state.addons.shop = {
				inventories: {},
			};
		}
		return state.addons.shop;
	}

	public static getInventory(
		state: GameState,
		playerId: string,
	): ShopInventoryItem[] {
		const slice = this.getSlice(state);
		return slice.inventories[playerId] ?? [];
	}

	public static addItem(
		state: GameState,
		playerId: string,
		item: ShopInventoryItem,
	): void {
		const slice = this.getSlice(state);
		slice.inventories[playerId] ??= [];
		slice.inventories[playerId].push(item);
	}

	public static removeItem(
		state: GameState,
		playerId: string,
		inventoryItemId: string,
	): ShopInventoryItem {
		const slice = this.getSlice(state);
		const list = slice.inventories[playerId] ?? [];
		const index = list.findIndex((it) => it.id === inventoryItemId);
		if (index === -1) {
			throw new ItemNotInInventoryError(inventoryItemId);
		}
		const [removed] = list.splice(index, 1);
		return removed;
	}
}
