import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class EndGameDto {
	@ApiProperty({
		description: "The ID of the game room to end",
		example: "abc123",
	})
	@IsUUID()
	roomId: string;
}
