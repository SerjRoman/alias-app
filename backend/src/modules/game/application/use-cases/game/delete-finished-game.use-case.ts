import type { EventEmitter2 } from "@nestjs/event-emitter";
import { GAME_UPDATED, GameUpdatedPayload } from "../../game.events";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import { DeleteGameDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";

export class DeleteFinishedGameUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async execute(dto: DeleteGameDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.assertRoomOwner(actor.id);
		room.assertGameFinished();

		await this.gameRepository.deleteGame(dto.roomId);

		const eventPayload: GameUpdatedPayload = {
			room: room.toPrimitives(),
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);
	}
}
