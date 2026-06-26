import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import {
	type GameSettings as DetailsGameSettings,
	GameStatus,
	type WordPackSelection,
} from "../../../domain/entities/game.entity";
import { PlayerResponseDto } from "./player.dto";
import { RoundResponseDto } from "./round-response.dto";
import { TeamResponseDto } from "./team-response.dto";

type GameSettings = Pick<
	DetailsGameSettings,
	| "name"
	| "roundTimeSeconds"
	| "pointsToWin"
	| "isPrivate"
	| "isVoiceChatEnabled"
	| "wordPackSelections"
	| "wordsPerPlayer"
>;

export class WordPackSelectionDto implements WordPackSelection {
	@ApiProperty({
		description: "The unique identifier of the word pack",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@Expose()
	packId: string;

	@ApiProperty({
		description: "The number of words to select from the word pack",
		example: 1000,
	})
	@Expose()
	count: number;
}
export class GameSettingsDto implements GameSettings {
	@ApiProperty({
		description: "The name of the game room",
		example: "My Awesome Game Room",
	})
	@Expose()
	name: string;
	@ApiProperty({
		description: "The round time in seconds",
		example: 60,
	})
	@Expose()
	roundTimeSeconds: number;
	@ApiProperty({
		description: "The points needed to win",
		example: 10,
	})
	@Expose()
	pointsToWin: number;
	@ApiProperty({
		description: "Whether the game is private",
		example: false,
	})
	@Expose()
	isPrivate: boolean;
	@ApiProperty({
		type: [WordPackSelectionDto],
		description: "List of word pack selections",
	})
	@Expose()
	@Type(() => WordPackSelectionDto)
	wordPackSelections: WordPackSelection[];
	@ApiProperty({
		description: "Whether only owner can start next round",
		example: true,
	})
	@Expose()
	isOnlyOwnerCanNextRound: boolean;
	@ApiProperty({
		description: "Whether only owner can change word score",
		example: true,
	})
	@Expose()
	isOnlyOwnerCanChangeScore: boolean;
	@ApiProperty({
		description: "Whether voice chat is enabled for this game room",
		example: true,
		default: true,
	})
	@Expose()
	isVoiceChatEnabled: boolean;



	@ApiProperty({
		description: "Number of custom words each player must submit",
		example: 5,
	})
	@Expose()
	wordsPerPlayer: number;

	@ApiProperty({
		description: "The language of the words used in the game",
		example: "ru",
		enum: ["ru", "en"],
	})
	@Expose()
	language: "ru" | "en";
}
export class BaseGameResponseDto {
	@ApiProperty({
		description: "The unique identifier of the game",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@Expose()
	id: string;
	@ApiProperty({
		type: "string",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@Expose()
	ownerId: string;
	@ApiProperty({
		enum: GameStatus,
	})
	@Expose()
	status: GameStatus;
	@ApiProperty({
		type: "number",
	})
	@Expose()
	playersCount: number;
	@ApiProperty({
		type: "number",
	})
	@Expose()
	createdAt: number;
}

export class GameResponseDto extends BaseGameResponseDto {
	@ApiProperty({
		type: GameSettingsDto,
		description: "Current game settings",
	})
	@Type(() => GameSettingsDto)
	@Expose()
	settings: GameSettingsDto;
}

export class BaseGameResponseDetailsDto extends BaseGameResponseDto {
	@ApiProperty({
		type: [PlayerResponseDto],
		description: "List of all players",
	})
	@Expose()
	@Type(() => PlayerResponseDto)
	players: PlayerResponseDto[];

	@ApiProperty({ type: [TeamResponseDto], description: "List of teams" })
	@Expose()
	@Type(() => TeamResponseDto)
	teams: TeamResponseDto[];

	@ApiPropertyOptional({
		type: RoundResponseDto,
		nullable: true,
		description: "Current active round",
	})
	@Expose()
	@Type(() => RoundResponseDto)
	currentRound: RoundResponseDto | null;

	@ApiPropertyOptional({
		type: String,
		nullable: true,
		example: "uuid-team-1",
		description: "ID of the winning team if game is over",
	})
	@Expose()
	winnerTeamId: string | null;

	@ApiProperty({
		example: 0,
		description: "Index of the last team that played",
	})
	@Expose()
	lastTeamPlayedIndex: number;
}

export class GameResponseDetailsDto extends BaseGameResponseDetailsDto {
	@ApiProperty({
		type: GameSettingsDto,
		description: "Current game settings",
	})
	@Type(() => GameSettingsDto)
	@Expose()
	settings: GameSettingsDto;
}

export class GameUpdateResponseDto extends BaseGameResponseDetailsDto {}
