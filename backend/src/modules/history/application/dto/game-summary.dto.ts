import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { GameSettingsDto } from "../../../game/application/dto/response/game-response.dto";
import { PaginatedResponseDto } from "@common/dto/paginated-response.dto";

export class ParticipantDisplayDataDto {
	@ApiProperty()
	@Expose()
	isRegistered: boolean;

	@ApiProperty({ nullable: true })
	@Expose()
	userId: string | null;

	@ApiProperty()
	@Expose()
	name: string;

	@ApiProperty()
	@Expose()
	avatarUrl: string;
}

export class GameSummaryTeamDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	name: string;
}

export class GameSummaryParticipantDto {
	@ApiProperty()
	@Expose()
	participantId: string;

	@ApiProperty()
	@Expose()
	teamId: string;

	@ApiProperty()
	@Expose()
	score: number;

	@ApiProperty({ type: ParticipantDisplayDataDto })
	@Type(() => ParticipantDisplayDataDto)
	@Expose()
	displayData: ParticipantDisplayDataDto;
}

export class RoundSummaryDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	roundNumber: number;

	@ApiProperty()
	@Expose()
	teamId: string;

	@ApiProperty()
	@Expose()
	guesserParticipantId: string;
}

export class GameSummaryResponseDto {
	@ApiProperty()
	@Expose()
	id: string;

	@ApiProperty()
	@Expose()
	status: string;

	@ApiProperty()
	@Expose()
	createdAt: Date;

	@ApiProperty({ type: GameSettingsDto })
	@Type(() => GameSettingsDto)
	@Expose()
	settings: GameSettingsDto;

	@ApiProperty({ type: [GameSummaryParticipantDto] })
	@Type(() => GameSummaryParticipantDto)
	@Expose()
	participants: GameSummaryParticipantDto[];

	@ApiProperty({ type: [RoundSummaryDto] })
	@Type(() => RoundSummaryDto)
	@Expose()
	roundsSummary: RoundSummaryDto[];

	@ApiProperty({ type: [GameSummaryTeamDto] })
	@Type(() => GameSummaryTeamDto)
	@Expose()
	teams: GameSummaryTeamDto[];
}
export class PaginatedGameSummaryResponse extends PaginatedResponseDto<GameSummaryResponseDto> {
	@ApiProperty({ type: [GameSummaryResponseDto] })
	declare items: GameSummaryResponseDto[];
}
