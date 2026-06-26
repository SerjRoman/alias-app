import { ApiProperty } from "@nestjs/swagger";
import {
	IsArray,
	IsBoolean,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	IsUUID,
	MaxLength,
	MinLength,
	ValidateNested,
	IsIn,
	Min,
} from "class-validator";
import { Type } from "class-transformer";

export class WordPackSelectionDto {
	@ApiProperty({
		description: "The ID of the word pack",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@IsString()
	@IsUUID()
	packId: string;

	@ApiProperty({
		description: "Number of words to take from this pack",
		example: 1000,
	})
	@IsNumber()
	@IsPositive()
	count: number;
}

export class CreateGameDto {
	@ApiProperty({
		description: "The name of the game",
		example: "My Awesome Game",
	})
	@IsString()
	@MinLength(3)
	@MaxLength(50)
	name: string;

	@ApiProperty({
		description: "Whether the game is private or not",
		example: false,
		default: false,
	})
	@IsOptional()
	@IsBoolean()
	isPrivate?: boolean = false;

	@ApiProperty({
		description: "The round time in seconds",
		example: 60,
	})
	@IsNumber()
	@IsPositive()
	roundTimeSeconds: number = 60;

	@ApiProperty({
		description: "The number of points required to win the game",
		example: 30,
	})
	@IsNumber()
	@IsPositive()
	pointsToWin: number = 30;

	@ApiProperty({
		description: "Word pack selections for the game",
		example: [
			{ packId: "123e4567-e89b-12d3-a456-426614174000", count: 1000 },
		],
		type: [WordPackSelectionDto],
		required: false,
	})
	@IsArray()
	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => WordPackSelectionDto)
	wordPackSelections?: WordPackSelectionDto[] = [];

	@ApiProperty({
		description:
			"Number of custom words each player must submit",
		example: 5,
		default: 0,
	})
	@IsNumber()
	@Min(0)
	@IsOptional()
	wordsPerPlayer?: number = 0;

	@ApiProperty({ type: Boolean, default: true })
	@IsBoolean()
	@IsOptional()
	isOnlyOwnerCanNextRound?: boolean = true;

	@ApiProperty({ type: Boolean, default: true })
	@IsBoolean()
	@IsOptional()
	isOnlyOwnerCanChangeScore?: boolean = true;

	@ApiProperty({
		description: "The language of the words used in the game",
		example: "ru",
		enum: ["ru", "en"],
		default: "ru",
	})
	@IsString()
	@IsOptional()
	language?: "ru" | "en" = "ru";
}
