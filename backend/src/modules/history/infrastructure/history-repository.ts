import { Injectable } from "@nestjs/common";
import { HistoryGameOrmEntity } from "./entities";
import { Repository } from "typeorm";
import { IHistoryRepository } from "../application/history.repository";
import { HistoryGameEntity } from "../domain/history.entity";
import { HistoryGameMapper } from "./mapper";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class HistoryRepository implements IHistoryRepository {
	constructor(
		@InjectRepository(HistoryGameOrmEntity)
		private readonly historyRepo: Repository<HistoryGameOrmEntity>,
	) {}
	async save(gameHistory: HistoryGameEntity): Promise<void> {
		const ormEntity = HistoryGameMapper.toOrm(gameHistory);
		await this.historyRepo.save(ormEntity);
	}
	async findGamesByUserIdWithRelations(
		userId: string,
		limit: number,
		offset: number,
	): Promise<[HistoryGameEntity[], number]> {
		const total = await this.historyRepo
			.createQueryBuilder("history")
			.where((qb) => {
				const participantGamesSubQuery = qb
					.subQuery()
					.select("hp.gameId")
					.from("history_participants", "hp")
					.where("hp.userId = :userId")
					.getQuery();
				const roundParticipantGamesSubQuery = qb
					.subQuery()
					.select("hr.gameId")
					.from("history_round_participants", "hrp")
					.innerJoin("history_rounds", "hr", "hr.id = hrp.roundId")
					.where("hrp.playerId = :userId")
					.getQuery();
				return `history.id IN ${participantGamesSubQuery} OR history.id IN ${roundParticipantGamesSubQuery}`;
			})
			.setParameter("userId", userId)
			.orderBy("history.createdAt", "DESC")
			.getCount();

		const gameIdRows = await this.historyRepo
			.createQueryBuilder("history")
			.select("history.id", "id")
			.where((qb) => {
				const participantGamesSubQuery = qb
					.subQuery()
					.select("hp.gameId")
					.from("history_participants", "hp")
					.where("hp.userId = :userId")
					.getQuery();
				const roundParticipantGamesSubQuery = qb
					.subQuery()
					.select("hr.gameId")
					.from("history_round_participants", "hrp")
					.innerJoin("history_rounds", "hr", "hr.id = hrp.roundId")
					.where("hrp.playerId = :userId")
					.getQuery();
				return `history.id IN ${participantGamesSubQuery} OR history.id IN ${roundParticipantGamesSubQuery}`;
			})
			.setParameter("userId", userId)
			.orderBy("history.createdAt", "DESC")
			.take(limit)
			.skip(offset)
			.getRawMany<{ id: string }>();

		if (gameIdRows.length === 0) {
			return [[], total];
		}

		const gameIds = gameIdRows.map((row) => row.id);

		const ormEntities = await this.historyRepo
			.createQueryBuilder("history")
			.leftJoinAndSelect("history.participants", "participant")
			.leftJoinAndSelect("history.teams", "teams")
			.leftJoinAndSelect("history.rounds", "rounds")
			.leftJoinAndSelect("rounds.participants", "roundParticipants")
			.where("history.id IN (:...gameIds)", { gameIds })
			.orderBy("history.createdAt", "DESC")
			.addOrderBy("rounds.roundNumber", "ASC")
			.getMany();

		const entitiesById = new Map(
			ormEntities.map((entity) => [entity.id, entity]),
		);
		const orderedEntities = gameIds
			.map((id) => entitiesById.get(id))
			.filter((entity): entity is HistoryGameOrmEntity => !!entity);

		return [
			orderedEntities.map((orm) => HistoryGameMapper.toDomain(orm)),
			total,
		];
	}
	async findByIdWithRelations(
		gameId: string,
	): Promise<HistoryGameEntity | null> {
		const ormEntity = await this.historyRepo.findOne({
			where: { id: gameId },
			relations: [
				"participants",
				"participants.team",
				"teams",
				"rounds",
				"rounds.participants",
			],
		});
		return ormEntity ? HistoryGameMapper.toDomain(ormEntity) : null;
	}
	async updateGameState(
		gameId: string,
		status: string,
		winnerTeamId: string | null,
	): Promise<void> {
		await this.historyRepo.update(gameId, {
			status,
			winnerTeamId,
		});
	}
}
