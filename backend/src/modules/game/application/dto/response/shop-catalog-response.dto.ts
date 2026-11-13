import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import type {
	EffectItemId,
	ShopItemTarget,
	ShopItemDurationType,
} from "../../../domain";

export class ShopCatalogItemDto {
	@ApiProperty({
		example: "DOUBLE_POINTS",
		description: "Unique item identifier",
	})
	@Expose()
	id: EffectItemId;

	@ApiProperty({
		example: "×2 Очки",
		description: "Localized item name",
	})
	@Expose()
	name: string;

	@ApiProperty({
		example:
			"Удваивает очки за угаданные слова в текущем/следующем раунде своей команды",
		description: "Item effect description",
	})
	@Expose()
	description: string;

	@ApiProperty({
		example: 10,
		description: "Price in game currency coins",
	})
	@Expose()
	price: number;

	@ApiProperty({
		example: "self_team",
		enum: ["self_team", "enemy_team", "enemy_player"],
		description: "Target entity type of the item",
	})
	@Expose()
	target: ShopItemTarget;

	@ApiProperty({
		example: "round",
		enum: ["round", "charges", "seconds", "instant"],
		description: "Duration type of the item effect",
	})
	@Expose()
	durationType: ShopItemDurationType;

	@ApiPropertyOptional({
		example: 1,
		description: "Number of charges if durationType is charges",
	})
	@Expose()
	charges?: number;

	@ApiPropertyOptional({
		example: 5,
		description: "Duration in seconds if durationType is seconds",
	})
	@Expose()
	durationSeconds?: number;

	@ApiPropertyOptional({
		example: "isVoiceChatEnabled",
		description: "Required game setting for item to be active",
	})
	@Expose()
	requiresSetting?: "isVoiceChatEnabled";

	@ApiProperty({
		example: true,
		description:
			"Whether this item is currently available for purchase in this room",
	})
	@Expose()
	isAvailable: boolean;
}

export class ShopCatalogResponseDto {
	@ApiProperty({
		type: [ShopCatalogItemDto],
		description:
			"List of items in the shop catalog with availability status",
	})
	@Expose()
	@Type(() => ShopCatalogItemDto)
	items: ShopCatalogItemDto[];

	@ApiProperty({
		example: 3,
		description: "Maximum number of items allowed in player inventory",
	})
	@Expose()
	maxInventorySize: number;

	@ApiProperty({
		example: true,
		description: "Whether shop is enabled in this room",
	})
	@Expose()
	isShopEnabled: boolean;
}
