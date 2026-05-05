import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { DeleteGameDto } from "../../../dto/body";
import {
	GAME_FINISHED,
	type GameFinishedPayload,
} from "../../game.events";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";

export class DeleteFinishedGameUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async execute(dto: DeleteGameDto, actorId: string) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.assertRoomOwner(actorId);
		room.assertGameFinished();

		await this.gameRepository.deleteGame(dto.roomId);

		const eventPayload: GameFinishedPayload = {
			room: room.toPrimitives(),
		};
		this.eventEmitter.emit(GAME_FINISHED, eventPayload);
	}
}
