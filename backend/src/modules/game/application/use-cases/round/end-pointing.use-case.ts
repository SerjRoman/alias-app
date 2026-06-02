import { Injectable, Inject } from "@nestjs/common";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { UserDto } from "@common/dto/user.dto";
import { GameSharedService } from "../../game-shared.service";
import { EndPointingDto } from "../../dto/body";
import { GameStatus } from "../../../domain/entities/game.entity";
import { GameUpdatedPayload, GAME_UPDATED } from "../../game.events";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DictionaryService } from "../../dictionary.service";
import { RoundScheduler } from "../../round-scheduler.service";

@Injectable()
export class EndPointingUseCase {
	constructor(
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
		private readonly roundScheduler: RoundScheduler,
		private readonly dictionaryService: DictionaryService,
	) {}
	async execute(dto: EndPointingDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.assertRoomOwner(actor.id);
		room.endPointing();
		await this.gameRepository.saveGame(room);

		if (room.status === GameStatus.FINISHED) {
			this.roundScheduler.scheduleGameDeletion(
				room.id,
				24 * 60 * 60 * 1000,
			);
		} else {
			await this.dictionaryService.popWordForGame(room.id);
		}

		const eventPayload: GameUpdatedPayload = {
			room: room.toPrimitives(),
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);
	}
}
