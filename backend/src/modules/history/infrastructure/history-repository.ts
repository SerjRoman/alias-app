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
		const [ormEntities, total] = await this.historyRepo
			.createQueryBuilder("history")
			.leftJoinAndSelect("history.participants", "participant")
			.leftJoinAndSelect("history.teams", "teams")
			.leftJoinAndSelect("history.rounds", "rounds")
			.leftJoinAndSelect("rounds.participants", "roundParticipants")
			.where((qb) => {
				const subQuery = qb
					.subQuery()
					.select("hp.gameId")
					.from("history_participants", "hp")
					.where("hp.userId = :userId")
					.getQuery();
				return "history.id IN " + subQuery;
			})
			.setParameter("userId", userId)
			.orderBy("history.createdAt", "DESC")
			.take(limit)
			.skip(offset)
			.getManyAndCount();

		return [
			ormEntities.map((orm) => HistoryGameMapper.toDomain(orm)),
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
