import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameSharedService } from "../../game-shared.service";
import { IGameRepository } from "../../game.repository.interface";
import { UserDto } from "@common/dto/user.dto";
import { ROUND_UPDATED, RoundUpdatedPayload } from "../../game.events";
import { SetGuesserDto } from "../../dto/body";

export class SetGuesserUseCase {
	constructor(
		private readonly gameRepository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(dto: SetGuesserDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.setGuesser(dto.playerId, actor.id);
		await this.gameRepository.saveGame(room);
		const roomPrimitives = room.toPrimitives();
		const payload: RoundUpdatedPayload = {
			roomId: room.id,
			round: roomPrimitives.currentRound!,
		};
		this.eventEmitter.emit(ROUND_UPDATED, payload);
		return roomPrimitives;
	}
}
