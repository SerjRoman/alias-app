import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { WordResponseDto } from "../../../game/application/dto/response";
import { PaginatedResponseDto } from "@common/dto/paginated-response.dto";

export class ParticipantStatsDto {
	@ApiProperty()
	@Expose()
	participantId: string;

	@ApiProperty()
	@Expose()
	teamId: string;

	@ApiProperty()
	@Expose()
	scoreAfterRound: number;
}

export class RoundDetailsResponseDto {
	@ApiProperty()
	@Expose()
	roundId: string;

	@ApiProperty()
	@Expose()
	number: number;

	@ApiProperty()
	@Expose()
	guesserId: string;

	@ApiProperty()
	@Expose()
	teamId: string;

	@ApiProperty({
		description: "Words for the round",
		type: [WordResponseDto],
	})
	@Type(() => WordResponseDto)
	@Expose()
	words: WordResponseDto[];

	@ApiProperty({ type: [ParticipantStatsDto] })
	@Type(() => ParticipantStatsDto)
	@Expose()
	participantsStats: ParticipantStatsDto[];
}
export class PaginatedRoundDetailsResponse extends PaginatedResponseDto<RoundDetailsResponseDto> {
	@ApiProperty({ type: [RoundDetailsResponseDto] })
	declare items: RoundDetailsResponseDto[];
}
