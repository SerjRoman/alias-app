import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class FindAllGamesByUserIdDto {
	@ApiProperty({
		description: "The ID of the user whose game history is being requested",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@IsUUID()
	userId: string;
}
