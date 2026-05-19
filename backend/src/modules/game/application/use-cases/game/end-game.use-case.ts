import { UserDto } from "@common/dto/user.dto";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { GAME_UPDATED, GameUpdatedPayload } from "../../game.events";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EndGameDto } from "../../dto/body/end-game.dto";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class EndGameUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(dto: EndGameDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.endGame(actor.id);
		await this.gameRepository.saveGame(room);
		const eventPayload: GameUpdatedPayload = {
			room: room.toPrimitives(),
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);

		return room.toPrimitives();
	}
}
