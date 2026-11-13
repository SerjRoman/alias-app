import { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundStatus, type GameState } from "../../domain";
import { GameChatService } from "./game-chat.service";
import {
	CHAT_MESSAGE_CREATED,
	SYSTEM_LOG_CREATED,
	SYSTEM_LOG_KEYS,
} from "./chat.types";

describe("GameChatService", () => {
	const createGameState = (overrides: Partial<GameState> = {}): GameState =>
		({
			id: "room-1",
			name: "Test",
			status: "IN_PROGRESS",
			ownerId: "u1",
			players: [
				{ id: "u1", name: "Alice", teamId: "t1", isReady: true },
				{ id: "u2", name: "Bob", teamId: "t1", isReady: true },
				{ id: "u3", name: "Spec", isReady: true },
			],
			teams: [{ id: "t1", name: "Alpha", color: "#38bdf8", score: 0 }],
			spectators: ["u3"],
			currentRound: {
				id: "r1",
				roundNumber: 1,
				teamId: "t1",
				explainerId: "u1",
				status: RoundStatus.IN_PROGRESS,
				currentWord: null,
				words: [],
				expiresAt: Date.now() + 30000,
			},
			...overrides,
		}) as GameState;

	let service: GameChatService;
	let mockGameRepo: { findGameById: jest.Mock };
	let mockChatRepo: {
		appendMessage: jest.Mock;
		getMessages: jest.Mock;
		appendLog: jest.Mock;
		getLogs: jest.Mock;
	};
	let eventEmitter: EventEmitter2;

	beforeEach(() => {
		mockGameRepo = {
			findGameById: jest.fn(),
		};
		mockChatRepo = {
			appendMessage: jest.fn().mockResolvedValue(undefined),
			getMessages: jest.fn().mockResolvedValue([]),
			appendLog: jest.fn().mockResolvedValue(undefined),
			getLogs: jest.fn().mockResolvedValue([]),
		};
		eventEmitter = new EventEmitter2();
		jest.spyOn(eventEmitter, "emit");

		service = new GameChatService(
			mockGameRepo as never,
			mockChatRepo as never,
			eventEmitter,
		);
	});

	it("allows explainer to send message to 'all' channel during active round", async () => {
		const state = createGameState();
		mockGameRepo.findGameById.mockResolvedValue({ getState: () => state });

		const res = await service.sendPlayerMessage(
			{ id: "u1", name: "Alice" } as never,
			{ roomId: "room-1", channel: "all", text: "hello all" },
		);

		expect(res).toEqual({ success: true });
		expect(mockChatRepo.appendMessage).toHaveBeenCalledTimes(1);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			CHAT_MESSAGE_CREATED,
			expect.objectContaining({
				roomId: "room-1",
				message: expect.objectContaining({
					channel: "all",
					senderId: "u1",
					text: "hello all",
				}),
			}),
		);
	});

	it("blocks explainer from sending message to 'team' channel during IN_PROGRESS round and emits private system log", async () => {
		const state = createGameState();
		mockGameRepo.findGameById.mockResolvedValue({ getState: () => state });

		const res = await service.sendPlayerMessage(
			{ id: "u1", name: "Alice" } as never,
			{ roomId: "room-1", channel: "team", text: "secret hint" },
		);

		expect(res).toEqual({ success: false });
		expect(mockChatRepo.appendMessage).not.toHaveBeenCalled();
		expect(mockChatRepo.appendLog).toHaveBeenCalledWith(
			"room-1",
			expect.objectContaining({
				isPrivate: true,
				targetUserId: "u1",
				i18nKey: SYSTEM_LOG_KEYS.EXPLAINER_TEAM_CHAT_BLOCKED,
			}),
		);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			SYSTEM_LOG_CREATED,
			expect.objectContaining({
				roomId: "room-1",
				log: expect.objectContaining({
					isPrivate: true,
					targetUserId: "u1",
				}),
			}),
		);
	});

	it("allows teammate (non-explainer) to send message to 'team' channel during active round", async () => {
		const state = createGameState();
		mockGameRepo.findGameById.mockResolvedValue({ getState: () => state });

		const res = await service.sendPlayerMessage(
			{ id: "u2", name: "Bob" } as never,
			{ roomId: "room-1", channel: "team", text: "guessing!" },
		);

		expect(res).toEqual({ success: true });
		expect(mockChatRepo.appendMessage).toHaveBeenCalledWith(
			"room-1",
			expect.objectContaining({
				channel: "team",
				teamId: "t1",
				senderId: "u2",
				text: "guessing!",
			}),
		);
	});

	it("blocks spectator from sending message to 'team' channel", async () => {
		const state = createGameState();
		mockGameRepo.findGameById.mockResolvedValue({ getState: () => state });

		const res = await service.sendPlayerMessage(
			{ id: "u3", name: "Spec" } as never,
			{ roomId: "room-1", channel: "team", text: "hi" },
		);

		expect(res).toEqual({ success: false });
		expect(mockChatRepo.appendMessage).not.toHaveBeenCalled();
		expect(mockChatRepo.appendLog).toHaveBeenCalledWith(
			"room-1",
			expect.objectContaining({
				isPrivate: true,
				targetUserId: "u3",
				i18nKey: SYSTEM_LOG_KEYS.SPECTATOR_TEAM_CHAT_BLOCKED,
			}),
		);
	});
});
