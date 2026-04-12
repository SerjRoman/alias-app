import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class TeamResponseDto {
	@ApiProperty({ example: "uuid-team-1" })
	@Expose()
	id: string;

	@ApiProperty({ example: "The Winners" })
	@Expose()
	name: string;

	@ApiProperty({
		type: [String],
		example: ["uuid-player-1", "uuid-player-2"],
	})
	@Expose()
	playerIds: string[];

	@ApiProperty({ example: 42 })
	@Expose()
	score: number;

	@ApiProperty({
		example: 0,
		description: "Index of the last player who explained",
	})
	@Expose()
	lastGuesserIndex: number;
}
