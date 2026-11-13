import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, IsUUID } from "class-validator";
import type { WordOutcome } from "../../../domain";

export class ChangeWordOutcomeDto {
	@IsString()
	@IsUUID()
	@ApiProperty({
		description: "The unique identifier of the game room.",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	roomId: string;

	@IsString()
	@IsUUID()
	@ApiProperty({
		description: "The unique identifier of the word.",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	wordId: string;

	@ApiProperty({
		enum: ["guessed", "skipped", "neutral"],
		example: "guessed",
		description: "The new outcome of the word.",
	})
	@IsString()
	@IsIn(["guessed", "skipped", "neutral"])
	outcome: WordOutcome;
}
