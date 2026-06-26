import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString, IsNotEmpty, ArrayNotEmpty } from "class-validator";

export class SubmitCustomWordsDto {
	@ApiProperty({
		description: "The unique identifier of the game room",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@IsString()
	@IsNotEmpty()
	roomId: string;

	@ApiProperty({
		description: "Array of words written by the user",
		example: ["apple", "banana", "cherry"],
		type: [String],
	})
	@IsArray()
	@ArrayNotEmpty()
	@IsString({ each: true })
	words: string[];
}
