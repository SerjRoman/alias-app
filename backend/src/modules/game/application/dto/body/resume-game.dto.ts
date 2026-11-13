import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class ResumeGameDto {
	@ApiProperty({
		description: "ID of the game room",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@IsUUID()
	roomId: string;
}
