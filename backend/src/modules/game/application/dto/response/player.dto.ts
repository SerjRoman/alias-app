import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class PlayerResponseDto {
	@ApiProperty({ example: "uuid-player-1" })
	@Expose()
	id: string;

	@ApiProperty({ example: "John Doe" })
	@Expose()
	name: string;

	@ApiProperty({ example: true, description: "Is player ready in lobby" })
	@Expose()
	isReady: boolean;

	@ApiProperty({
		example: false,
		description: "Is player ready for the round",
	})
	@Expose()
	isRoundReady: boolean;

	@ApiProperty({ example: 10, description: "Player's individual score" })
	@Expose()
	score: number;

	@ApiProperty({
		example: false,
		description: "Is player online",
	})
	@Expose()
	isOnline: boolean;

	@ApiProperty({
		example: 0,
		description:
			"Number of custom words submitted by the player (in custom mode)",
	})
	@Expose()
	submittedWordsCount: number;
}
