import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
	HISTORY_ROUND_REPOSITORY,
	type IHistoryRoundRepository,
} from "../history.repository";
import { RoundDetailsResponseDto } from "../dto/round-details.dto";

@Injectable()
export class GetRoundDetailsUseCase {
	constructor(
		@Inject(HISTORY_ROUND_REPOSITORY)
		private readonly repository: IHistoryRoundRepository,
	) {}

	public async execute(roundId: string): Promise<RoundDetailsResponseDto> {
		const round = await this.repository.findById(roundId);
		if (!round) {
			throw new NotFoundException(`Round with ID ${roundId} not found`);
		}

		const primitives = round.toPrimitives();
		console.log("Round primitives:", primitives); // Debug log to check the structure of primitives
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
	}
}
