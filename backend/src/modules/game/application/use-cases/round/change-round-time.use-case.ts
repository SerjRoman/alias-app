import { UserDto } from "@common/dto/user.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ChangeRoundTimeDto } from "../../dto/body";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { RoundScheduler } from "../../round-scheduler.service";
import { ROUND_UPDATED, RoundUpdatedPayload } from "../../game.events";
import { RoundNotActiveError } from "../../../domain/errors/round.errors";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class ChangeRoundTimeUseCase {
	constructor(
		@Inject(GAME_REPOSITORY)
		private readonly repository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
		private readonly roundScheduler: RoundScheduler,
	) {}
	async execute(dto: ChangeRoundTimeDto, actor: UserDto) {
		const game = await this.gameSharedService.loadGame(dto.roomId);
		const round = game.currentRound;
		game.asserRoundIsActive();
		game.assertRoundInProgress();
		if (!round) {
			throw new RoundNotActiveError();
		}
		const newDuration = this.roundScheduler.changeRoundTime(
			dto.roomId,
			dto.seconds * 1000,
		);
		if (newDuration) {
			game.updateRoundTime(newDuration + Date.now());
		}

		const eventPayload: RoundUpdatedPayload = {
			round: round.toPrimitives(),
			roomId: game.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
		await this.repository.saveGame(game);
	}
}
