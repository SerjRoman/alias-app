import { ApiProperty } from "@nestjs/swagger";
import {
	IsArray,
	IsOptional,
	IsString,
	ArrayNotEmpty,
	MaxLength,
	MinLength,
} from "class-validator";

export class CreateWordPackDto {
	@ApiProperty({
		description: "The name of the word pack",
		example: "Custom Fun Pack",
	})
	@IsString()
	@MinLength(3)
	@MaxLength(50)
	name: string;

	@ApiProperty({
		description: "A description of the word pack",
		example: "A pack containing fun and casual words for friendly parties.",
		nullable: true,
		required: false,
	})
	@IsString()
	@IsOptional()
	@MaxLength(200)
	description?: string;

	@ApiProperty({
		description: "The language of the word pack",
		example: "ru",
		default: "ru",
	})
	@IsString()
	language: string;

	@ApiProperty({
		description: "The type of the word pack",
		example: "custom",
		default: "custom",
	})
	@IsString()
	type: string = "custom";

	@ApiProperty({
		description: "List of words in the pack",
		example: ["apple", "banana", "cherry"],
		type: [String],
	})
	@IsArray()
	@IsString({ each: true })
	@ArrayNotEmpty()
	words: string[];
}
