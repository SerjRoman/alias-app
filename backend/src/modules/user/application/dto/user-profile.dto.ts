import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class UserProfileDto {
	@ApiProperty({
		description: "User ID",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@Expose()
	id: string;

	@ApiProperty({ description: "Display name", example: "John Doe" })
	@Expose()
	name: string;

	@ApiProperty({ description: "Username", example: "johndoe123" })
	@Expose()
	username: string;

	@ApiProperty({
		description: "Avatar URL",
		example: "https://example.com/avatar.jpg",
	})
	@Expose()
	avatarUrl: string;

	@ApiProperty({ description: "Total games played", example: 42 })
	@Expose()
	totalGamesPlayed: number;

	@ApiProperty({ description: "Total wins", example: 15 })
	@Expose()
	totalWins: number;

	@ApiProperty({ description: "Total score", example: 1250 })
	@Expose()
	totalScore: number;
}
