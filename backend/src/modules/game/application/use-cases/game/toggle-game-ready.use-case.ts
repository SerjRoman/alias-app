import { type EventEmitter2 } from "@nestjs/event-emitter";
import { type GameSharedService } from "../../game-shared.service";
import { type PlayersUpdatedPayload, PLAYERS_UPDATED } from "../../game.events";
import { type IGameRepository } from "../../game.repository.interface";
import { UserDto } from "@common/dto/user.dto";

export class ToggleReadyUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly repository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(roomId: string, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(roomId);
		room.togglePlayerGameReady(actor.id);
		await this.repository.saveGame(room);
		const eventPayload: PlayersUpdatedPayload = {
			roomId: room.id,
			players: room.players.map((p) => p.toPrimitives()),
		};
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayload);
		return room.toPrimitives();
	}
}
