import { ApiProperty } from "@nestjs/swagger";
import {
	IsArray,
	IsBoolean,
	IsIn,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	IsUUID,
	MaxLength,
	MinLength,
	ValidateNested,
	Min,
} from "class-validator";
import { Type } from "class-transformer";
import { WordPackSelectionDto } from "./create-game.dto";

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
		description: "Word pack selections for the game",
		example: [
			{ packId: "123e4567-e89b-12d3-a456-426614174000", count: 1000 },
		],
		type: [WordPackSelectionDto],
	})
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => WordPackSelectionDto)
	@IsOptional()
	wordPackSelections?: WordPackSelectionDto[];

	@ApiProperty({
		description: "Whether voice chat is enabled for the game",
		example: true,
		default: true,
	})
	@IsOptional()
	@IsBoolean()
	isVoiceChatEnabled?: boolean;

	@ApiProperty({
		description:
			"Number of custom words each player must submit",
		example: 5,
	})
	@IsNumber()
	@Min(0)
	@IsOptional()
	wordsPerPlayer?: number;

	@ApiProperty({
		description: "Whether hat mode is enabled",
		example: false,
	})
	@IsBoolean()
	@IsOptional()
	isHatMode?: boolean;

}
