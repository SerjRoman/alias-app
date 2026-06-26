import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { GameDeletedEvent } from "../../domain/events/game.events";
import { GAME_REPOSITORY, type IGameRepository } from "../game.repository.interface";
import { VoiceService } from "../voice.service";

@Injectable()
export class CleanupGameResourcesHandler {
	private readonly logger = new Logger(CleanupGameResourcesHandler.name);

	constructor(
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly voiceService: VoiceService,
	) {}

	@OnEvent(GameDeletedEvent.eventName)
	async handle(event: GameDeletedEvent) {
		this.logger.log(
			`Received GameDeletedEvent. Cleaning up resources for roomId=${event.roomId}`,
		);

		if (event.playerIds.length > 0) {
			try {
				await this.gameRepository.removeUserRooms(event.playerIds);
				this.logger.log(`Successfully removed user rooms for players: ${event.playerIds.join(", ")}`);
			} catch (error) {
				this.logger.error(`Failed to remove user rooms for game ${event.roomId}: ${error}`);
			}
		}

		try {
			await this.voiceService.deleteVoiceRoom(event.roomId);
			this.logger.log(`Successfully deleted voice room for game ${event.roomId}`);
		} catch (error) {
			this.logger.error(`Failed to delete voice room for game ${event.roomId}: ${error}`);
		}
	}
}
