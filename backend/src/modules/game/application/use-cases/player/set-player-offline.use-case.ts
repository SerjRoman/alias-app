import { type EventEmitter2 } from "@nestjs/event-emitter";
import type { GameSharedService } from "../../game-shared.service";
import { type PlayersUpdatedPayload, PLAYERS_UPDATED } from "../../game.events";
import type { IGameRepository } from "../../game.repository.interface";
import { UserDto } from "@common/dto/user.dto";

export class SetPlayerOfflineUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly repository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(roomId: string, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(roomId);
		room.setPlayerOffline(actor.id);
		await this.repository.saveGame(room);
		const eventPayload: PlayersUpdatedPayload = {
			players: room.players.map((p) => p.toPrimitives()),
			roomId: room.id,
		};
		this.eventEmitter.emit(PLAYERS_UPDATED, eventPayload);
	}
}
