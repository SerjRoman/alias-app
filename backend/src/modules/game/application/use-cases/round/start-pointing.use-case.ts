import { Injectable, Inject } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundNotActiveError } from "../../../domain/errors/round.errors";
import { GameSharedService } from "../../game-shared.service";
import { RoundUpdatedPayload, ROUND_UPDATED } from "../../game.events";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { UserDto } from "@common/dto/user.dto";
import { StartPointingDto } from "../../dto/body";
import { RoundScheduler } from "../../round-scheduler.service";

@Injectable()
export class StartPointingUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
		private readonly roundScheduler: RoundScheduler,
	) {}
	async execute(dto: StartPointingDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		if (!room.currentRound) {
			throw new RoundNotActiveError();
		}

		await this.gameSharedService.checkAndSetWordsForGame(room);
		room.startPointing(actor.id);
		this.roundScheduler.clearRoundTimeout(dto.roomId);
		await this.gameRepository.saveGame(room);

		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
		return eventPayload;
	}
}
