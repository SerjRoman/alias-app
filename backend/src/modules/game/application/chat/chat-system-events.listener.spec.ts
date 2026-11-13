import {
	ItemPurchasedDomainEvent,
	ItemUsedDomainEvent,
	RoundEndedDomainEvent,
	RoundStartedDomainEvent,
	type GameState,
} from "../../domain";
import { ChatSystemEventsListener } from "./chat-system-events.listener";
import { SYSTEM_LOG_KEYS } from "./chat.types";

describe("ChatSystemEventsListener", () => {
	const baseState = (): GameState =>
		({
			id: "room-1",
			name: "Room",
			status: "IN_PROGRESS",
			ownerId: "u1",
			players: [
				{ id: "u1", name: "Alice", teamId: "t1", isReady: true },
				{ id: "u2", name: "Bob", teamId: "t2", isReady: true },
			],
			teams: [
				{ id: "t1", name: "Red", score: 10 },
				{ id: "t2", name: "Blue", score: 12 },
			],
			currentRound: {
				id: "r2",
				roundNumber: 2,
				teamId: "t2",
				explainerId: "u2",
				status: "FINISHED",
				currentWord: null,
				words: [
					{ id: "w1", text: "apple", score: 2 },
					{ id: "w2", text: "banana", score: 1 },
				],
				expiresAt: Date.now(),
			},
		}) as GameState;

	let listener: ChatSystemEventsListener;
	let mockGameRepo: { findGameById: jest.Mock };
	let mockChatRepo: {
		getLastLeaderTeamId: jest.Mock;
		setLastLeaderTeamId: jest.Mock;
	};
	let mockChatService: {
		emitPublicSystemLog: jest.Mock;
		emitPrivateSystemLog: jest.Mock;
	};

	beforeEach(() => {
		mockGameRepo = {
			findGameById: jest.fn(),
		};
		mockChatRepo = {
			getLastLeaderTeamId: jest.fn().mockResolvedValue("t1"),
			setLastLeaderTeamId: jest.fn().mockResolvedValue(undefined),
		};
		mockChatService = {
			emitPublicSystemLog: jest.fn().mockResolvedValue(undefined),
			emitPrivateSystemLog: jest.fn().mockResolvedValue(undefined),
		};

		listener = new ChatSystemEventsListener(
			mockGameRepo as never,
			mockChatRepo as never,
			mockChatService as never,
		);
	});

	it("emits public effect log on ItemUsedDomainEvent targeting a player", async () => {
		mockGameRepo.findGameById.mockResolvedValue({
			getState: () => baseState(),
		});

		await listener.handleItemUsed(
			new ItemUsedDomainEvent(
				"room-1",
				"u1",
				"VOICE_MUTE",
				"eff-1",
				"ACTIVE",
				undefined,
				"u2",
			),
		);

		expect(mockChatService.emitPublicSystemLog).toHaveBeenCalledWith(
			"room-1",
			"effect",
			SYSTEM_LOG_KEYS.ITEM_USED_PLAYER,
			{
				playerName: "Alice",
				itemId: "VOICE_MUTE",
				targetName: "Bob",
			},
		);
	});

	it("emits private purchase log on ItemPurchasedDomainEvent", async () => {
		await listener.handleItemPurchased(
			new ItemPurchasedDomainEvent("room-1", "u1", "DOUBLE_POINTS", "inv-1", 5, 10),
		);

		expect(mockChatService.emitPrivateSystemLog).toHaveBeenCalledWith(
			"room-1",
			"u1",
			SYSTEM_LOG_KEYS.ITEM_PURCHASED_PRIVATE,
			{
				itemId: "DOUBLE_POINTS",
				cost: 5,
				balance: 10,
			},
		);
	});

	it("emits roundStarted log on RoundStartedDomainEvent", async () => {
		mockGameRepo.findGameById.mockResolvedValue({
			getState: () => baseState(),
		});

		await listener.handleRoundStarted(
			new RoundStartedDomainEvent("room-1", "r2", "t2", "u2", Date.now()),
		);

		expect(mockChatService.emitPublicSystemLog).toHaveBeenCalledWith(
			"room-1",
			"round",
			SYSTEM_LOG_KEYS.ROUND_STARTED,
			{
				roundNumber: 2,
				teamName: "Blue",
				explainerName: "Bob",
			},
		);
	});

	it("emits roundEnded with earned points and newLeader when sole leader changes", async () => {
		const state = baseState();
		await listener.handleRoundEnded(
			new RoundEndedDomainEvent("room-1", "r2", "t2", 12, false, state),
		);

		expect(mockChatService.emitPublicSystemLog).toHaveBeenCalledWith(
			"room-1",
			"round",
			SYSTEM_LOG_KEYS.ROUND_ENDED,
			{
				roundNumber: 2,
				teamName: "Blue",
				earnedPoints: 3,
			},
		);

		expect(mockChatRepo.setLastLeaderTeamId).toHaveBeenCalledWith(
			"room-1",
			"t2",
		);
		expect(mockChatService.emitPublicSystemLog).toHaveBeenCalledWith(
			"room-1",
			"leader",
			SYSTEM_LOG_KEYS.NEW_LEADER,
			{
				teamName: "Blue",
				score: 12,
			},
		);
	});

	it("emits admin action log", async () => {
		mockGameRepo.findGameById.mockResolvedValue({
			getState: () => baseState(),
		});

		await listener.handleAdminAction({
			roomId: "room-1",
			adminId: "u1",
			adminName: "Alice",
			action: "kickPlayer",
			targetPlayerId: "u2",
		});

		expect(mockChatService.emitPublicSystemLog).toHaveBeenCalledWith(
			"room-1",
			"admin",
			SYSTEM_LOG_KEYS.adminAction("kickPlayer"),
			{
				adminName: "Alice",
				targetName: "Bob",
			},
		);
	});
});
