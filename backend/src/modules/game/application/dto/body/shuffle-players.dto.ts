import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class ShufflePlayersDto {
	@ApiProperty({
		description: "The ID of the game room to shuffle players in",
		example: "abc123",
	})
	@IsUUID()
	roomId: string;
}
