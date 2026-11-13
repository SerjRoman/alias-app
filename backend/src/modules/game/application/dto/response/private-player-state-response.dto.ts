import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { WordResponseDto } from "./word-response.dto";
import { ShopInventoryItemDto, PlayerAddonsStateDto } from "./game-addons.dto";

export { ShopInventoryItemDto };

export class PrivatePlayerStateResponseDto {
	@ApiPropertyOptional({
		type: WordResponseDto,
		nullable: true,
		description:
			"Active word if the requesting player is the current explainer",
	})
	@Expose()
	@Type(() => WordResponseDto)
	word: WordResponseDto | null;

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

	@ApiPropertyOptional({
		type: PlayerAddonsStateDto,
		description:
			"Player's private addon slices (economy balance, shop inventory, etc.)",
	})
	@Expose()
	@Type(() => PlayerAddonsStateDto)
	addons?: PlayerAddonsStateDto;
}
