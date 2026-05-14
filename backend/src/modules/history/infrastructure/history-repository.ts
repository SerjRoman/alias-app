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
	): Promise<HistoryGameEntity[]> {
		const ormEntities = await this.historyRepo
			.createQueryBuilder("history")
			.leftJoinAndSelect("history.participants", "participant")
			.where("participant.userId = :userId", { userId })
			.leftJoinAndSelect("history.teams", "teams")
			.leftJoinAndSelect("history.rounds", "rounds")
			.leftJoinAndSelect("rounds.participants", "roundParticipants")
			.getMany();
		return ormEntities.map((orm) => HistoryGameMapper.toDomain(orm));
	}
	async findById(gameId: string): Promise<HistoryGameEntity | null> {
		const ormEntity = await this.historyRepo.findOne({
			where: { id: gameId },
		});
		return ormEntity ? HistoryGameMapper.toDomain(ormEntity) : null;
	}
}
