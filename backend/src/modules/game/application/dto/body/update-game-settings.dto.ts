import { ApiProperty } from "@nestjs/swagger";
import {
	IsString,
	MinLength,
	MaxLength,
	IsOptional,
	IsBoolean,
	IsNumber,
	IsPositive,
	IsUUID,
	IsIn,
} from "class-validator";
import type { GameWordsLevel } from "../../../domain/entities/game.entity";

export class UpdateGameSettingsDto {
	@ApiProperty({
		description: "The unique identifier of the game room",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@IsString()
	@IsUUID()
	roomId: string;

	@ApiProperty({
		description: "The name of the game",
		example: "My Awesome Game",
	})
	@IsString()
	@MinLength(3)
	@MaxLength(50)
	@IsOptional()
	name?: string;

	@ApiProperty({
		description: "Whether the game is private or not",
		example: false,
		default: false,
	})
	@IsOptional()
	@IsBoolean()
	isPrivate?: boolean;


	@ApiProperty({
		description: "The round time in seconds",
		example: 60,
	})
	@IsNumber()
	@IsPositive()
	@IsOptional()
	roundTimeSeconds?: number;

	@ApiProperty({
		description: "The number of points required to win the game",
		example: 30,
	})
	@IsNumber()
	@IsPositive()
	@IsOptional()
	pointsToWin?: number;

	@ApiProperty({
		description: "The difficulty level of the words used in the game",
		example: "medium",
		enum: ["easy", "medium", "hard"],
	})
	@IsString()
	@IsOptional()
	@IsIn(["easy", "medium", "hard"])
	level?: GameWordsLevel;

	@ApiProperty({
		description: "Whether voice chat is enabled for the game",
		example: true,
		default: true,
	})
	@IsOptional()
	@IsBoolean()
	isVoiceChatEnabled?: boolean;

	@ApiProperty({
		description: "The language of the words used in the game",
		example: "ru",
		enum: ["ru", "en"],
	})
	@IsString()
	@IsOptional()
	@IsIn(["ru", "en"])
	language?: "ru" | "en";
}
