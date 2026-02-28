import { IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class DeleteGameDto {
	@ApiProperty({
		description: "The unique identifier of the game room to be deleted.",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	@IsString()
	@IsUUID()
	roomId: string;
}
