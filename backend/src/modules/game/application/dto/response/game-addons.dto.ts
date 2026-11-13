import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import type { EffectItemId } from "../../../domain";
import type { LedgerRecord } from "../../../domain/economy/economy.types";
import type { ShopInventoryItem } from "../../../domain/shop/shop.types";

/**
 * DTO for an individual financial transaction in the economy ledger.
 */
export class LedgerRecordDto implements LedgerRecord {
	@ApiProperty({
		example: "tx-uuid-1",
		description: "Unique identifier of the financial transaction",
	})
	@Expose()
	id: string;

	@ApiProperty({
		example: "player-uuid-1",
		description: "ID of the player whose balance was updated",
	})
	@Expose()
	playerId: string;

	@ApiProperty({
		example: 2,
		description: "Coin amount added (positive) or deducted (negative)",
	})
	@Expose()
	delta: number;

	@ApiProperty({
		example: 12,
		description: "Player coin balance after this transaction",
	})
	@Expose()
	balanceAfter: number;

	@ApiProperty({
		example: "round_guessed_words",
		description: "Reason or category code for the transaction",
	})
	@Expose()
	reason: string;

	@ApiProperty({
		example: 1794318000000,
		description:
			"Unix epoch timestamp (ms) when the transaction took place",
	})
	@Expose()
	timestamp: number;
}

/**
 * DTO for the complete Economy addon state slice.
 */
export class EconomyAddonDto {
	@ApiProperty({
		example: { "player-1": 150, "player-2": 50 },
		description: "Map of player IDs to their current coin balances",
	})
	@Expose()
	wallets: Record<string, number>;

	@ApiProperty({
		type: [LedgerRecordDto],
		description: "Complete chronological audit trail of coin transactions",
	})
	@Expose()
	@Type(() => LedgerRecordDto)
	ledger: LedgerRecordDto[];
}

/**
 * DTO for an item in a player's inventory.
 */
export class ShopInventoryItemDto implements ShopInventoryItem {
	@ApiProperty({
		example: "inv-uuid-1",
		description: "Unique identifier of the inventory instance",
	})
	@Expose()
	id: string;

	@ApiProperty({
		example: "DOUBLE_POINTS",
		description: "Catalog identifier of the item effect",
	})
	@Expose()
	itemId: EffectItemId;

	@ApiProperty({
		example: 1794318000000,
		description: "Unix epoch timestamp (ms) when the item was purchased",
	})
	@Expose()
	purchasedAt: number;
}

/**
 * DTO for the complete Shop addon state slice.
 */
export class ShopAddonDto {
	@ApiProperty({
		description: "Map of player IDs to their purchased inventory items",
		example: {
			"player-1": [
				{
					id: "inv-1",
					itemId: "DOUBLE_POINTS",
					purchasedAt: 1794318000000,
				},
			],
		},
	})
	@Expose()
	inventories: Record<string, ShopInventoryItemDto[]>;
}

/**
 * DTO for the full addons container (internal/admin use).
 */
export class FullGameAddonsDto {
	@ApiPropertyOptional({
		type: EconomyAddonDto,
		description: "Economy addon state slice",
	})
	@Expose()
	@Type(() => EconomyAddonDto)
	economy?: EconomyAddonDto;

	@ApiPropertyOptional({
		type: ShopAddonDto,
		description: "Shop addon state slice",
	})
	@Expose()
	@Type(() => ShopAddonDto)
	shop?: ShopAddonDto;

	[key: string]: unknown;
}

/**
 * DTO for public addons state broadcast (sanitized, hides wallets and inventories).
 */
export class PublicGameAddonsDto {
	[key: string]: unknown;
}

/**
 * DTO for a player's personal economy state slice.
 */
export class PlayerEconomyAddonDto {
	@ApiProperty({
		example: 100,
		description: "Player's current coin balance",
	})
	@Expose()
	balance: number;
}

/**
 * DTO for a player's personal shop state slice.
 */
export class PlayerShopAddonDto {
	@ApiProperty({
		type: [ShopInventoryItemDto],
		description: "Items in the player's private inventory",
	})
	@Expose()
	@Type(() => ShopInventoryItemDto)
	inventory: ShopInventoryItemDto[];
}

/**
 * Container DTO for a player's private addon state slices.
 */
export class PlayerAddonsStateDto {
	@ApiPropertyOptional({
		type: PlayerEconomyAddonDto,
		description: "Player's private economy balance",
	})
	@Expose()
	@Type(() => PlayerEconomyAddonDto)
	economy?: PlayerEconomyAddonDto;

	@ApiPropertyOptional({
		type: PlayerShopAddonDto,
		description: "Player's private inventory",
	})
	@Expose()
	@Type(() => PlayerShopAddonDto)
	shop?: PlayerShopAddonDto;

	[key: string]: unknown;
}
