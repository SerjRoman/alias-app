import { Inject, Injectable } from "@nestjs/common";
import {
	HISTORY_ROUND_REPOSITORY,
	type IHistoryRoundRepository,
} from "../history.repository";
import { RoundDetailsResponseDto } from "../dto/round-details.dto";
import { PaginatedResponseDto } from "@common/dto/paginated-response.dto";
import { FindRoundsByGameIdDto } from "../dto/find-rounds-by-game-id.dto";

@Injectable()
export class FindRoundsByGameIdUseCase {
	constructor(
		@Inject(HISTORY_ROUND_REPOSITORY)
		private readonly repository: IHistoryRoundRepository,
	) {}

	public async execute(
		dto: FindRoundsByGameIdDto,
	): Promise<PaginatedResponseDto<RoundDetailsResponseDto>> {
		const limit = dto.limit ?? 10;
		const offset = dto.offset ?? 0;

		const [rounds, total] = await this.repository.findRoundsByGameId(
			dto.gameId,
			limit,
			offset,
		);

		const details = rounds.map((round) => {
			const primitives = round.toPrimitives();
			return {
				roundId: primitives.id,
				number: primitives.roundNumber,
				guesserId: primitives.guesserId,
				teamId: primitives.teamId,
				words: primitives.words,
				participantsStats: primitives.participants.map((p) => ({
					participantId: p.playerId || "",
					teamId: p.teamId,
					scoreAfterRound: p.scoreAfterRound,
				})),
			};
		});

		return new PaginatedResponseDto<RoundDetailsResponseDto>(
			details,
			total,
			limit,
			offset,
		);
	}
}
