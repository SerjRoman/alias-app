import { Injectable } from "@nestjs/common";
import { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import { FinishRoundDto } from "../../dto/body";
import { GameUpdatedPayload, ROUND_UPDATED } from "../../game.events";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { UserDto } from "@common/dto/user.dto";

@Injectable()
export class FinishRoundUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(dto: FinishRoundDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.finishRound();
		await this.gameRepository.saveGame(room);
		const primitives = room.toPrimitives();
		const eventPayload: GameUpdatedPayload = {
			room: primitives,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
		return primitives;
	}
}
