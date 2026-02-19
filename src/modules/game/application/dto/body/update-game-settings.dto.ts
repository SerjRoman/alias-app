import { ApiProperty } from "@nestjs/swagger";
import {
	IsString,
	MinLength,
	MaxLength,
	IsOptional,
	IsBoolean,
	IsNumber,
	IsPositive,
} from "class-validator";

export class UpdateGameSettingsDto {
	@ApiProperty({
		description: "The unique identifier of the game room",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@IsString()
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
	isPrivate?: boolean = false;

	@ApiProperty({
		description: "The time limit for each turn in seconds",
		example: 60,
	})
	@IsNumber()
	@IsPositive()
	@IsOptional()
	timeLimit?: number = 60;

	@ApiProperty({
		description: "The number of points required to win the game",
		example: 30,
	})
	@IsNumber()
	@IsPositive()
	@IsOptional()
	pointsToWin?: number = 30;
}
