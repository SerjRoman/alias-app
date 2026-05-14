import { Module } from "@nestjs/common";
import { SaveGameOnGameStartHandler } from "./application/handlers/save-game-on-game-start";
import { HistoryRoundRepository } from "./infrastructure/history-round-repository";
import { HistoryRepository } from "./infrastructure/history-repository";
import { SaveHistoryOnGameFinishedHandler } from "./application/handlers/save-history-on-game-finished";
import { SaveRoundOnRoundFinishedHandler } from "./application/handlers/save-round-on-round-finished";
import { HistoryController } from "./presentation/history.controller";
import {
	HISTORY_REPOSITORY,
	HISTORY_ROUND_REPOSITORY,
} from "./application/history.repository";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
	HistoryGameOrmEntity,
	HistoryParticipantOrmEntity,
	HistoryRoundOrmEntity,
	HistoryRoundParticipantOrmEntity,
	HistoryTeamOrmEntity,
} from "./infrastructure/entities";
import { FindAllGamesByUserIdUseCase } from "./application/use-case/find-all-games-by-user-id";
import { GetRoundDetailsUseCase } from "./application/use-case/get-round-details.use-case";
import { FindRoundsByGameIdUseCase } from "./application/use-case/find-rounds-by-game-id.use-case";
import { UserModule } from "../user/user.module";

@Module({
	imports: [
		TypeOrmModule.forFeature([
			HistoryGameOrmEntity,
			HistoryRoundOrmEntity,
			HistoryParticipantOrmEntity,
			HistoryTeamOrmEntity,
			HistoryRoundParticipantOrmEntity,
		]),
		UserModule,
	],
	providers: [
		SaveGameOnGameStartHandler,
		SaveHistoryOnGameFinishedHandler,
		SaveRoundOnRoundFinishedHandler,
		FindAllGamesByUserIdUseCase,
		GetRoundDetailsUseCase,
		FindRoundsByGameIdUseCase,
		{
			provide: HISTORY_REPOSITORY,
			useClass: HistoryRepository,
		},
		{
			provide: HISTORY_ROUND_REPOSITORY,
			useClass: HistoryRoundRepository,
		},
	],
	controllers: [HistoryController],
})
export class HistoryModule {}
