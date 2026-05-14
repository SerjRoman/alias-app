import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type, Exclude } from "class-transformer";
import { WordResponseDto } from "./word-response.dto";
import { RoundStatus } from "../../../domain/entities/round.entity";

export class RoundResponseDto {
	@ApiProperty({ example: "uuid-round-1" })
	@Expose()
	id: string;

	@ApiProperty({
		example: "uuid-player-1",
		description: "ID of the player explaining words",
	})
	@Expose()
	guesserId: string;

	@ApiProperty({ example: "uuid-team-1" })
	@Expose()
	teamId: string;

	@ApiProperty({
		example: "number",
		description: "Unix time left in seconds",
	})
	@Expose()
	endTime: number;

	@ApiProperty({ enum: RoundStatus })
	@Expose()
	status: RoundStatus;

	@ApiPropertyOptional({ type: WordResponseDto, nullable: true })
	@Exclude()
	@Type(() => WordResponseDto)
	currentWord: WordResponseDto | null;

	@ApiProperty({ type: [WordResponseDto] })
	@Type(() => WordResponseDto)
	@Expose()
	words: WordResponseDto[];
}
