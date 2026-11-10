import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class TeamResponseDto {
	@ApiProperty({ example: "uuid-team-1" })
	@Expose()
	id: string;

	@ApiProperty({ example: "The Winners" })
	@Expose()
	name: string;

	@ApiPropertyOptional({ example: "#FF0000" })
	@Expose()
	color?: string;

	@ApiProperty({
		type: [String],
		example: ["uuid-player-1", "uuid-player-2"],
	})
	@Expose()
	playerIds: string[];

	@ApiProperty({ example: 42 })
	@Expose()
	score: number;

	@ApiPropertyOptional({
		example: "uuid-player-1",
		nullable: true,
		description: "ID of the last player who explained in this team",
	})
	@Expose()
	lastExplainerId?: string | null;
}
