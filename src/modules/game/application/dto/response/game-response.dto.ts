import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
export class GameResponseDto {
	@ApiProperty({
		description: "The unique identifier of the game",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@Expose()
	id: string;
	@ApiProperty({
		description: "The name of the game",
		example: "My Awesome Game",
	})
	@Expose()
	name: string;
	@ApiProperty({
		description: "Whether the game is private or not",
		example: false,
	})
	@Expose()
	isPrivate: boolean;
	@ApiProperty({
		description: "The unique identifier of the game owner",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@Expose()
	ownerId: string;
	@ApiProperty({
		description: "Whether the game has started or not",
		example: false,
	})
	@Expose()
	isGameStarted: boolean;
}
