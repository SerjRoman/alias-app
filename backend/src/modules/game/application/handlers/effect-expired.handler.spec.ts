import type { EventEmitter2 } from "@nestjs/event-emitter";
import { EffectExpiredHandler } from "./effect-expired.handler";
import { EffectExpiredDomainEvent } from "../../domain/events/game.events";
import { GAME_UPDATED } from "../game.events";
import type { GameState } from "../../domain/state/game.state";

describe("EffectExpiredHandler - Strict TDD", () => {
	let handler: EffectExpiredHandler;
	let eventEmitter: jest.Mocked<EventEmitter2>;

	beforeEach(() => {
		eventEmitter = {
			emit: jest.fn(),
		} as unknown as jest.Mocked<EventEmitter2>;

		handler = new EffectExpiredHandler(eventEmitter);
	});

	it("emits GAME_UPDATED with room snapshot when EffectExpiredDomainEvent is received", () => {
		const mockState = {
			id: "room-123",
			status: "IN_PROGRESS",
			activeEffects: [],
		} as unknown as GameState;

		const event = new EffectExpiredDomainEvent(
			"room-123",
			"eff-1",
			"VOICE_MUTE",
			mockState,
		);

		handler.handle(event);

		expect(eventEmitter.emit).toHaveBeenCalledWith(GAME_UPDATED, {
			room: mockState,
		});
	});

	it("does not emit GAME_UPDATED if gameState is missing from event", () => {
		const event = new EffectExpiredDomainEvent(
			"room-123",
			"eff-1",
			"VOICE_MUTE",
		);

		handler.handle(event);

		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});
});
