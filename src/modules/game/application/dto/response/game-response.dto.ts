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
	"roomName" | "roundTimeSeconds" | "pointsToWin" | "isPrivate"
>;
export class GameResponseDto {
	@ApiProperty({
		description: "The unique identifier of the game",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@Expose()
	id: string;
	@ApiProperty({
		description: "The name of the game",
		example: "My Awesome Game",
	})
	@Expose()
	name: string;
	@ApiProperty({
		enum: GameStatus,
	})
	@ApiProperty({
		type: "string",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	@Expose()
	ownerId: string;
	@Expose()
	status: GameStatus;
	@Expose()
	settings: GameSettings;
	@Expose()
	isGameStarted: boolean;
	@Expose()
	playersCount: number;
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
