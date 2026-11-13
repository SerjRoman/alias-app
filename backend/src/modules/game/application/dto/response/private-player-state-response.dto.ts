import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { ShopInventoryItemDto } from "./game-addons.dto";

export class PrivatePlayerStateResponseDto {
	@ApiProperty({
		example: 100,
		description: "Player's current coin balance",
	})
	@Expose()
	balance: number;

	@ApiProperty({
		type: [ShopInventoryItemDto],
		description: "Items in the player's private inventory",
	})
	@Expose()
	@Type(() => ShopInventoryItemDto)
	inventory: ShopInventoryItemDto[];
}
