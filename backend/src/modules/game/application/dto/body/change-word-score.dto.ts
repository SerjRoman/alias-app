import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, IsUUID, Max, Min } from "class-validator";

export class ChangeWordScoreDto {
	@IsString()
	@IsUUID()
	@ApiProperty({
		description:
			"The unique identifier of the game room to which the team will be added.",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	roomId: string;
	@IsString()
	@IsUUID()
	@ApiProperty({
		description: "The unique identifier of the word.",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	wordId: string;

	@ApiProperty({ type: "number" })
	@IsNumber()
	@Min(-1)
	@Max(1)
	delta: number;
}
