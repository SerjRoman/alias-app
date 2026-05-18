import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsUUID } from "class-validator";

export class ChangeRoundTimeDto {
	@ApiProperty({
		description: "ID of the game room",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@IsUUID()
	roomId: string;
	@ApiProperty({
		description: "New round time in seconds",
		example: 60,
	})
	@IsNumber()
	seconds: number;
}
