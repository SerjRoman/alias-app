import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { NextRoundDto } from "../../../dto/body";
import type { UserDto } from "../../../../auth/dto/user.dto";
import { GAME_UPDATED, type GameUpdatedPayload } from "../../game.events";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import type { DictionaryService } from "../../dictionary.service";
import type { RoundScheduler } from "../../round-scheduler.service";
import { GameStatus } from "../../../domain/entities/game.entity";

export class NextRoundUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
		private readonly dictionaryService: DictionaryService,
		private readonly roundScheduler: RoundScheduler,
	) {}

	async execute(dto: NextRoundDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.nextRound(actor.id);

		if (room.status === GameStatus.FINISHED) {
			this.roundScheduler.scheduleGameDeletion(room.id, 24 * 60 * 60 * 1000);
		} else {
			this.dictionaryService.popWordForGame(room.id);
		}

		await this.gameRepository.saveGame(room);

		const eventPayload: GameUpdatedPayload = {
			room: room.toPrimitives(),
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);
	}
}
