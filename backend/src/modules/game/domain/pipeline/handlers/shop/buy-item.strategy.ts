import { v4 as uuidv4 } from "uuid";
import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type { BuyItemAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import { EconomyService } from "../../../economy";
import {
	ShopService,
	SHOP_CATALOG,
	MAX_INVENTORY_SIZE,
	type ShopCatalogItem,
	ShopDisabledError,
	ShopItemNotFoundError,
	ShopItemDisabledError,
	InventoryFullError,
	InvalidEffectTargetError,
} from "../../../shop";
import {
	GameNotInProgressError,
	PlayerNotFoundError,
} from "../../../errors/game.errors";
import { ItemPurchasedDomainEvent } from "../../../events/game.events";

export class BuyItemStrategy implements ActionStrategy<BuyItemAction> {
	readonly actionType = "BUY_ITEM" as const;

	constructor(
		private readonly catalog: readonly ShopCatalogItem[] = SHOP_CATALOG,
		private readonly maxInventorySize: number = MAX_INVENTORY_SIZE,
	) {}

	handle(action: BuyItemAction, ctx: ActionContext): void {
		const { state, emit, now } = ctx;

		if (state.settings?.isShopEnabled === false) {
			throw new ShopDisabledError();
		}

		if (state.status !== "IN_PROGRESS") {
			throw new GameNotInProgressError();
		}

		const playerId = action.actorId;
		const player = state.players.find((p) => p.id === playerId);
		if (!player) {
			throw new PlayerNotFoundError(playerId);
		}

		if (!player.teamId) {
			throw new InvalidEffectTargetError(
				"Player must belong to a team to buy items",
			);
		}

		const { itemId } = action.payload;
		const catalogItem = this.catalog.find((it) => it.id === itemId);
		if (!catalogItem) {
			throw new ShopItemNotFoundError(itemId);
		}

		if (catalogItem.requiresSetting) {
			const settingValue = Boolean(
				state.settings?.[catalogItem.requiresSetting],
			);
			if (!settingValue) {
				throw new ShopItemDisabledError(
					itemId,
					catalogItem.requiresSetting,
				);
			}
		}

		const inventory = ShopService.getInventory(state, playerId);
		if (inventory.length >= this.maxInventorySize) {
			throw new InventoryFullError(playerId, this.maxInventorySize);
		}

		const timestamp = now ?? Date.now();

		// Withdraw coins (throws InsufficientFundsError if balance is insufficient)
		EconomyService.withdraw(
			state,
			playerId,
			catalogItem.price,
			`buy_item:${itemId}`,
			timestamp,
		);

		const inventoryItemId = uuidv4();
		ShopService.addItem(state, playerId, {
			id: inventoryItemId,
			itemId: catalogItem.id,
			purchasedAt: timestamp,
		});

		const remainingBalance = EconomyService.getBalance(state, playerId);

		emit(
			new ItemPurchasedDomainEvent(
				state.id,
				playerId,
				itemId,
				inventoryItemId,
				catalogItem.price,
				remainingBalance,
			),
		);
	}
}
