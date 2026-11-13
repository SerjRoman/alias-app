import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";
import type { EffectItemId } from "../../../domain/state/game.state";

export class BuyItemDto {
	@ApiProperty({
		description: "ID of the game room",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@IsUUID()
	roomId: string;

	@ApiProperty({
		description: "Identifier of the item to buy",
		example: "DOUBLE_POINTS",
	})
	@IsString()
	@IsNotEmpty()
	itemId: EffectItemId;
}
