import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import {
	type GameSettings as DetailsGameSettings,
	GameStatus,
} from "../../../domain/entities/game.entity";
import { TeamStateDto } from "../team.dto";
import { PlayerResponseDto } from "./player.dto";
import { RoundStateDto } from "../round.dto";

type GameSettings = Pick<
	DetailsGameSettings,
	"name" | "roundTimeSeconds" | "pointsToWin" | "isPrivate"
>;
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
}
export class GameResponseDto {
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
		type: GameSettingsDto,
		description: "Current game settings",
	})
	@Type(() => GameSettingsDto)
	@Expose()
	settings: GameSettingsDto;
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

export class GameResponseDetailsDto extends GameResponseDto {
	@ApiProperty({
		type: [PlayerResponseDto],
		description: "List of all players",
	})
	@Expose()
	@Type(() => PlayerResponseDto)
	players: PlayerResponseDto[];

	@ApiProperty({ type: [TeamStateDto], description: "List of teams" })
	@Expose()
	@Type(() => TeamStateDto)
	teams: TeamStateDto[];

	@ApiPropertyOptional({
		type: RoundStateDto,
		nullable: true,
		description: "Current active round",
	})
	@Expose()
	@Type(() => RoundStateDto)
	currentRound: RoundStateDto | null;

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
	lastTeamIndex: number;
}
