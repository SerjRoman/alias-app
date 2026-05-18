import { ApiProperty } from "@nestjs/swagger";

export class SetGuesserDto {
	@ApiProperty({
		description: "ID of the player to set as guesser",
		example: "player123",
	})
	playerId: string;
	@ApiProperty({
		description: "ID of the game room",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	roomId: string;
}
