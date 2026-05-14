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
}
