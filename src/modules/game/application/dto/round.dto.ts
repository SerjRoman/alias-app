import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Exclude, Expose, Type } from "class-transformer";
import { WordDto } from "./word.dto";

export class RoundStateDto {
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

	@ApiProperty({ type: [WordDto] })
	@Expose()
	@Type(() => WordDto)
	guessedWords: WordDto[];

	@ApiProperty({ type: [WordDto] })
	@Expose()
	@Type(() => WordDto)
	skippedWords: WordDto[];

	@ApiProperty({ example: true })
	@Expose()
	isStarted: boolean;

	@ApiPropertyOptional({ type: WordDto, nullable: true })
	@Exclude()
	@Type(() => WordDto)
	currentWord: WordDto | null;
}
