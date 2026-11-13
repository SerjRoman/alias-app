import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class UseItemDto {
	@ApiProperty({
		description: "ID of the game room",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@IsUUID()
	roomId: string;

	@ApiProperty({
		description: "ID of the item in player inventory to use",
		example: "inv-item-123",
	})
	@IsString()
	@IsNotEmpty()
	inventoryItemId: string;

	@ApiPropertyOptional({
		description: "Target team ID if effect targets a team",
		example: "team-123",
	})
	@IsOptional()
	@IsString()
	targetTeamId?: string;

	@ApiPropertyOptional({
		description: "Target player ID if effect targets a player",
		example: "user-123",
	})
	@IsOptional()
	@IsString()
	targetPlayerId?: string;
}
