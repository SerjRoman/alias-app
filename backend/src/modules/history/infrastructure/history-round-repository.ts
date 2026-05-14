import { Injectable } from "@nestjs/common";
import { HistoryRoundOrmEntity } from "./entities";
import { Repository } from "typeorm";
import { IHistoryRoundRepository } from "../application/history.repository";
import { HistoryRoundMapper } from "./mapper";
import { HistoryRoundEntity } from "../domain/history-round.entity";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class HistoryRoundRepository implements IHistoryRoundRepository {
	constructor(
		@InjectRepository(HistoryRoundOrmEntity)
		private readonly historyRepo: Repository<HistoryRoundOrmEntity>,
	) {}
	async save(round: HistoryRoundEntity): Promise<void> {
		const ormEntity = HistoryRoundMapper.toOrm(round);
		await this.historyRepo.save(ormEntity);
	}

	async findById(id: string): Promise<HistoryRoundEntity | null> {
		const ormEntity = await this.historyRepo.findOne({
			where: { id },
			relations: ["participants"],
		});
		if (!ormEntity) {
			return null;
		}
		return HistoryRoundMapper.toDomain(ormEntity);
	}

	async findRoundsByGameId(
		gameId: string,
		limit: number,
		offset: number,
	): Promise<[HistoryRoundEntity[], number]> {
		const [ormEntities, total] = await this.historyRepo.findAndCount({
			where: { gameId },
			relations: ["participants"],
			order: { roundNumber: "ASC" },
			take: limit,
			skip: offset,
		});
		return [
			ormEntities.map((orm) => HistoryRoundMapper.toDomain(orm)),
			total,
		];
	}
}
