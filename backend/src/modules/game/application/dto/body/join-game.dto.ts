import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, Length } from "class-validator";

export class JoinGameDto {
	@ApiProperty({
		description: "The unique identifier of the game room.",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	@IsString()
	@IsUUID()
	roomId: string;

	@ApiProperty({})
	@IsString()
	@IsOptional()
	@Length(6)
	code?: string;
}
