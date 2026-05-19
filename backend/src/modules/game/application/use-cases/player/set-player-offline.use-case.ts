// TECH_DEBT: This use case is a bit of a hack to handle the case when a player disconnects without properly leaving the game. It should be refactored in the future to be more robust and handle edge cases better.
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
	PlayerNotFoundError,
	RoomNotFoundError,
} from "../../../domain/errors/game.errors";
import { GameSharedService } from "../../game-shared.service";
import { type PlayersUpdatedPayload, PLAYERS_UPDATED } from "../../game.events";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { UserDto } from "@common/dto/user.dto";
import { Injectable, Inject, Logger } from "@nestjs/common";

@Injectable()
export class SetPlayerOfflineUseCase {
	private readonly logger = new Logger(SetPlayerOfflineUseCase.name);

	constructor(
		private readonly gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		private readonly repository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async execute(roomId: string, actor: UserDto) {
		try {
			const room = await this.gameSharedService.loadGame(roomId);
			room.setPlayerOffline(actor.id);
			await this.repository.saveGame(room);
			const eventPayload: PlayersUpdatedPayload = {
				players: room.players.map((p) => p.toPrimitives()),
				roomId: room.id,
			};
			this.eventEmitter.emit(PLAYERS_UPDATED, eventPayload);
		} catch (error) {
			if (
				error instanceof RoomNotFoundError ||
				error instanceof PlayerNotFoundError
			) {
				await this.repository.removeUserRoom(actor.id);
				this.logger.warn(
					`Skipped setPlayerOffline for user ${actor.id}: ${error.message}`,
				);
				return;
			}
			throw error;
		}
	}
}
