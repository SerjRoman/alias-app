import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Type, Exclude } from "class-transformer";
import { WordResponseDto } from "./word-response.dto";
import { RoundStatus } from "../../../domain";

export class RoundResponseDto {
	@ApiProperty({ example: "uuid-round-1" })
	@Expose()
	id: string;

	@ApiProperty({
		example: "uuid-player-1",
		description: "ID of the player explaining words",
	})
	@Expose()
	explainerId: string;

	@ApiProperty({ example: "uuid-team-1" })
	@Expose()
	teamId: string;

	@ApiProperty({ example: 1, description: "Current round number" })
	@Expose()
	roundNumber: number;

	@ApiProperty({
		example: 1794318060000,
		description: "Unix timestamp when round expires (ms)",
	})
	@Expose()
	expiresAt: number;

	@ApiProperty({ enum: RoundStatus })
	@Expose()
	status: RoundStatus;

	@ApiPropertyOptional({ type: WordResponseDto, nullable: true })
	@Exclude()
	@Type(() => WordResponseDto)
	currentWord: WordResponseDto | null;

	@ApiProperty({ type: [WordResponseDto] })
	@Type(() => WordResponseDto)
	@Expose()
	words: WordResponseDto[];

	@ApiPropertyOptional({ example: 1794318000000, nullable: true })
	@Expose()
	pausedAt?: number | null;

	@ApiPropertyOptional({ example: 35000, nullable: true })
	@Expose()
	remainingMs?: number | null;
}
