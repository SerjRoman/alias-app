import { UserDto } from "@common/dto/user.dto";
import { type GameSharedService } from "../../game-shared.service";
import { type IGameRepository } from "../../game.repository.interface";
import { GAME_FINISHED, GameFinishedPayload } from "../../game.events";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EndGameDto } from "../../dto/body/end-game.dto";

export class EndGameUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(dto: EndGameDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.endGame(actor.id);
		await this.gameRepository.saveGame(room);
		const eventPayload: GameFinishedPayload = {
			room: room.toPrimitives(),
		};
		this.eventEmitter.emit(GAME_FINISHED, eventPayload);

		return room.toPrimitives();
	}
}
