import { Inject, Injectable, Logger } from "@nestjs/common";
import {
	HISTORY_REPOSITORY,
	type IHistoryRepository,
} from "../history.repository";
import { FindAllGamesByUserIdDto } from "../dto/find-all-games-by-user-id.dto";
import { GameSummaryResponseDto } from "../dto/game-summary.dto";
import { PaginatedResponseDto } from "@common/dto/paginated-response.dto";
import { UserFacade } from "../../../user/application/facades/user.facade";

@Injectable()
export class FindAllGamesByUserIdUseCase {
	private readonly logger = new Logger(FindAllGamesByUserIdUseCase.name);
	constructor(
		@Inject(HISTORY_REPOSITORY)
		private readonly repository: IHistoryRepository,
		private readonly userFacade: UserFacade,
	) {}

	public async execute(
		dto: FindAllGamesByUserIdDto,
	): Promise<PaginatedResponseDto<GameSummaryResponseDto>> {
		const limit = dto.limit ?? 10;
		const offset = dto.offset ?? 0;

		const [games, total] =
			await this.repository.findGamesByUserIdWithRelations(
				dto.userId,
				limit,
				offset,
			);
		this.logger.log(
			`Found ${JSON.stringify(games)} games for user ${dto.userId} (total: ${total})`,
		);
		const uniqueUserIds = new Set<string>();
		games.forEach((game) => {
			game.toPrimitives().participants.forEach((p) => {
				if (p.userId) {
					uniqueUserIds.add(p.userId);
				}
			});
		});

		const profiles = (
			await this.userFacade.getUsersShortInfo(Array.from(uniqueUserIds))
		).reduce((acc, profile) => {
			if (profile) {
				acc.set(profile.id, profile);
			}
			return acc;
		}, new Map<string, { name: string; avatarUrl: string; username: string }>());

		const summaries: GameSummaryResponseDto[] = [];

		for (const game of games) {
			const primitives = game.toPrimitives();
			const participantIdByPlayerId = new Map<string, string>();
			primitives.participants.forEach((participant) => {
				participantIdByPlayerId.set(participant.id, participant.id);
				if (participant.userId) {
					participantIdByPlayerId.set(participant.userId, participant.id);
				}
				const separatorIndex = participant.id.indexOf(":");
				if (separatorIndex !== -1) {
					const playerId = participant.id.slice(separatorIndex + 1);
					participantIdByPlayerId.set(playerId, participant.id);
				}
			});

			const participants = primitives.participants.map((p) => {
				let userProfile = {
					isRegistered: false,
					name: p.name,
					score: p.finalScore,
					avatarUrl: "",
					username: "",
					teamId: p.teamId,
				};

				const isRegistered = p.userId ? profiles.has(p.userId) : false;
				if (isRegistered) {
					userProfile = {
						...userProfile,
						...profiles.get(p.userId!)!,
						isRegistered: true,
					};
				}

				return {
					participantId: p.id,
					teamId: p.teamId,
					score: p.finalScore,
					displayData: {
						isRegistered: userProfile.isRegistered,
						userId: p.userId,
						name: p.userId ? userProfile.name : p.name,
						avatarUrl: userProfile.avatarUrl,
					},
				};
			});

			summaries.push({
				id: primitives.id,
				status: primitives.status,
				createdAt: primitives.createdAt,
				settings: primitives.settings,
				participants,
				teams: primitives.teams.map((t) => ({
					id: t.id,
					name: t.name,
				})),
				roundsSummary: primitives.rounds.map((r) => ({
					id: r.id,
					roundNumber: r.roundNumber,
					teamId: r.teamId,
					guesserParticipantId:
						participantIdByPlayerId.get(r.guesserId) ?? r.guesserId,
				})),
			});
		}

		return new PaginatedResponseDto<GameSummaryResponseDto>(
			summaries,
			total,
			limit,
			offset,
		);
	}
}
