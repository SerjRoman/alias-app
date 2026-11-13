import { Injectable, Logger, Optional } from "@nestjs/common";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { EffectExpiredDomainEvent } from "../../domain/events/game.events";
import { GAME_UPDATED, type GameUpdatedPayload } from "../game.events";
import { RoundScheduler } from "../round-scheduler.service";

@Injectable()
export class EffectExpiredHandler {
	private readonly logger = new Logger(EffectExpiredHandler.name);

	constructor(
		private readonly eventEmitter: EventEmitter2,
		@Optional()
		private readonly roundScheduler?: RoundScheduler,
	) {}

	@OnEvent(EffectExpiredDomainEvent.eventName)
	handle(event: EffectExpiredDomainEvent): void {
		this.logger.log(
			`Received EffectExpiredDomainEvent for effect ${event.effectId} (${event.itemId}) in room ${event.roomId}`,
		);

		this.roundScheduler?.clearEffectTimeout(event.roomId, event.effectId);

		if (event.gameState) {
			const payload: GameUpdatedPayload = { room: event.gameState };
			this.eventEmitter.emit(GAME_UPDATED, payload);
		}
	}
}
