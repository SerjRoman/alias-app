import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameSharedService } from "../../game-shared.service";
import { GameUpdatedPayload, GAME_UPDATED } from "../../game.events";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../../game.repository.interface";
import { UserDto } from "@common/dto/user.dto";
import { ShufflePlayersDto } from "../../dto/body";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class ShufflePlayersUseCase {
	constructor(
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(dto: ShufflePlayersDto, actor: UserDto) {
		const game = await this.gameSharedService.loadGame(dto.roomId);
		game.shufflePlayers(actor.id);
		this.repository.saveGame(game);
		const roomPrimitives = game.toPrimitives();
		const eventPayload: GameUpdatedPayload = {
			room: roomPrimitives,
		};
		this.eventEmitter.emit(GAME_UPDATED, eventPayload);
	}
}
