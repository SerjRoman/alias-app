import { ApiProperty } from "@nestjs/swagger";
import {
	IsBoolean,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	MaxLength,
	MinLength,
} from "class-validator";
import type { GameWordsLevel } from "../../../domain/entities/game.entity";

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
		description: "The time limit for each turn in seconds",
		example: 60,
	})
	@IsNumber()
	@IsPositive()
	timeLimit: number = 60;

	@ApiProperty({
		description: "The number of points required to win the game",
		example: 30,
	})
	@IsNumber()
	@IsPositive()
	pointsToWin: number = 30;

	@ApiProperty({
		description: "The difficulty level of the words used in the game",
		example: "medium",
		enum: ["easy", "medium", "hard"],
	})
	@IsString()
	@IsOptional()
	level: GameWordsLevel = "easy";

	@ApiProperty({ type: Boolean, default: true })
	@IsBoolean()
	@IsOptional()
	isOnlyOwnerCanNextRound?: boolean = true;

	@ApiProperty({ type: Boolean, default: true })
	@IsBoolean()
	@IsOptional()
	isOnlyOwnerCanChangeScore?: boolean = true;
}
