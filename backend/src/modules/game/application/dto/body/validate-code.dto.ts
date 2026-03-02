import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID, Length } from "class-validator";

export class ValidateCodeDto {
	@ApiProperty({ type: "string" })
	@IsString()
	@Length(6)
	code: string;
	@ApiProperty({
		description: "The unique identifier of the game room",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@IsString()
	@IsUUID()
	roomId: string;
}
