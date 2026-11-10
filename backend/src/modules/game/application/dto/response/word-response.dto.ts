import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import type { WordOutcome } from "../../../domain";

export class WordResponseDto {
	@ApiProperty({ example: "uuid-word-1", description: "Word ID" })
	@Expose()
	id: string;

	@ApiProperty({ example: "Apple", description: "The word text" })
	@Expose()
	text: string;

	@ApiProperty({ example: 1, description: "Points awarded for the word" })
	@Expose()
	score: number;

	@ApiPropertyOptional({
		enum: ["guessed", "skipped", "neutral"],
		description: "Outcome of the word during the round",
	})
	@Expose()
	outcome?: WordOutcome;

	@ApiPropertyOptional({
		type: [String],
		description: "IDs of active effects applied to this word",
	})
	@Expose()
	appliedEffectIds?: string[];
}
