import type { GameSharedService } from "../../game-shared.service";
import { UserDto } from "@common/dto/user.dto";
import { NextRoundDto } from "../../dto/body";
import { GAME_UPDATED, GameUpdatedPayload } from "../../game.events";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { IGameRepository } from "../../game.repository.interface";

export class NextRoundUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly repository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async execute(dto: NextRoundDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.finishRound(actor.id);
		room.nextRound(actor.id);

		await this.repository.saveGame(room);

		const roomPrimitives = room.toPrimitives();
		const eventPayload: GameUpdatedPayload = {
			room: roomPrimitives,
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);
	}
}
