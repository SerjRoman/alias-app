import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type, Transform } from "class-transformer";
import {
	type GameSettings as DetailsGameSettings,
	GameStatus,
	type WordPackSelection,
} from "../../../domain";
import { PlayerResponseDto } from "./player.dto";
import { RoundResponseDto } from "./round-response.dto";
import { TeamResponseDto } from "./team-response.dto";
import { PublicGameAddonsDto } from "./game-addons.dto";

type GameSettings = Pick<
	DetailsGameSettings,
	| "name"
	| "roundTimeSeconds"
	| "pointsToWin"
	| "isPrivate"
	| "isVoiceChatEnabled"
	| "wordPackSelections"
	| "wordsPerPlayer"
	| "isHatMode"
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
		description: "Whether hat mode is enabled",
		example: false,
	})
	@Expose()
	isHatMode: boolean;

	@ApiProperty({
		description: "Whether the in-game shop is enabled",
		example: false,
		default: false,
	})
	@Expose()
	isShopEnabled: boolean;

	@ApiProperty({
		description: "Whether in-game betting is enabled",
		example: false,
		default: false,
	})
	@Expose()
	isBettingEnabled: boolean;
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

export class LeftPlayerDto {
	@ApiProperty({ example: "uuid-player-1" })
	@Expose()
	id: string;

	@ApiProperty({ example: "Alice" })
	@Expose()
	name: string;

	@ApiPropertyOptional({ example: "uuid-team-1", nullable: true })
	@Expose()
	teamId: string | null;

	@ApiProperty({ example: 10 })
	@Expose()
	score: number;

	@ApiProperty({ example: 1794318000000 })
	@Expose()
	leftAt: number;
}

export class ActiveEffectResponseDto {
	@ApiProperty({ example: "eff-uuid-1" })
	@Expose()
	id: string;

	@ApiProperty({ example: "DOUBLE_POINTS" })
	@Expose()
	itemId: string;

	@ApiProperty({ example: "user-1" })
	@Expose()
	sourcePlayerId: string;

	@ApiPropertyOptional({ example: "team-1", nullable: true })
	@Expose()
	targetTeamId?: string;

	@ApiPropertyOptional({ example: "user-2", nullable: true })
	@Expose()
	targetPlayerId?: string;

	@ApiProperty({ example: "ACTIVE" })
	@Expose()
	status: string;

	@ApiPropertyOptional({ example: 1 })
	@Expose()
	charges?: number;

	@ApiPropertyOptional({ example: 1794318000000 })
	@Expose()
	expiresAt?: number;

	@ApiPropertyOptional({ example: 5000 })
	@Expose()
	durationMs?: number;

	@ApiPropertyOptional({ example: null, nullable: true })
	@Expose()
	pausedAt?: number | null;

	@ApiPropertyOptional({ example: null, nullable: true })
	@Expose()
	remainingMs?: number | null;
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

	@ApiProperty({
		type: [String],
		description: "List of spectator player IDs",
		example: ["uuid-player-1"],
	})
	@Expose()
	spectators: string[];

	@ApiPropertyOptional({
		type: [LeftPlayerDto],
		description: "Snapshots of players who left during the active game",
	})
	@Expose()
	@Type(() => LeftPlayerDto)
	leftPlayers?: LeftPlayerDto[];

	@ApiPropertyOptional({
		example: 1794318000000,
		nullable: true,
		description: "Timestamp when room owner went offline",
	})
	@Expose()
	ownerOfflineSince?: number | null;

	@ApiPropertyOptional({
		type: [ActiveEffectResponseDto],
		description: "List of active effects currently applied",
	})
	@Expose()
	@Type(() => ActiveEffectResponseDto)
	activeEffects?: ActiveEffectResponseDto[];

	@ApiPropertyOptional({
		type: PublicGameAddonsDto,
		description:
			"Public addon data slices (private economy and shop data are sanitized)",
	})
	@Expose()
	@Type(() => PublicGameAddonsDto)
	@Transform(({ value }) => {
		if (!value || typeof value !== "object") return value;
		const sanitized = { ...(value as Record<string, unknown>) };
		delete sanitized.shop;
		delete sanitized.economy;
		return Object.keys(sanitized).length > 0
			? (sanitized as PublicGameAddonsDto)
			: undefined;
	})
	addons?: PublicGameAddonsDto;
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
