import { EventEmitter2 } from "@nestjs/event-emitter";
import { GAME_UPDATED, GameUpdatedPayload } from "../../game.events";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { DeleteGameDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class DeleteFinishedGameUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async execute(dto: DeleteGameDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.assertRoomOwner(actor.id);
		room.assertGameFinished();

		room.delete();

		await this.gameRepository.deleteGame(dto.roomId);

		const events = room.pullDomainEvents();
		for (const event of events) {
			await this.eventEmitter.emitAsync(event.name, event);
		}

		const eventPayload: GameUpdatedPayload = {
			room: room.toPrimitives(),
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);
	}
}
