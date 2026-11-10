import { GameEngine } from "../engine/game-engine";
import {
	GameFinishedEvent,
	GameStartedEvent,
	RoundFinishedEvent,
	RoundStartedDomainEvent,
} from "../events/game.events";
import type { GameSettings } from "../state/game.state";
import { SaveGameOnGameStartHandler } from "../../../history/application/handlers/save-game-on-game-start";
import { SaveRoundOnRoundFinishedHandler } from "../../../history/application/handlers/save-round-on-round-finished";
import { SaveHistoryOnGameFinishedHandler } from "../../../history/application/handlers/save-history-on-game-finished";
import { UpdateUserStatOnGameFinishedHandler } from "../../../user/application/handlers/update-user-stat-on-game-finished";

let idCounter = 0;
jest.mock("uuid", () => ({
	v4: () => `flow-uuid-${++idCounter}`,
}));

describe("GameEngine Full Lifecycle Flow & Event Compatibility", () => {
	const ownerId = "user-1";
	const player2Id = "user-2";
	const player3Id = "user-3";

	const defaultSettings: GameSettings = {
		name: "Alias Room",
		roundTimeSeconds: 60,
		pointsToWin: 2,
		code: null,
		isPrivate: false,
		wordPackSelections: [],
		wordsPerPlayer: 0,
		isHatMode: false,
		isOnlyOwnerCanNextRound: false,
		isOnlyOwnerCanChangeScore: false,
		isVoiceChatEnabled: true,
	};

	it("1. Executes full game lifecycle (lobby, teams, round, pointing, explainer rotation, and win flow) via GameEngine", () => {
		const engine1 = GameEngine.create("room-flow-1", ownerId, {
			settings: defaultSettings,
			pointsToWin: defaultSettings.pointsToWin,
			roundTimeSeconds: defaultSettings.roundTimeSeconds,
		});
		engine1.dispatch({
			type: "JOIN_GAME",
			actorId: ownerId,
			payload: { playerId: ownerId, name: "Alice", role: "registered" },
		});
		engine1.dispatch({
			type: "JOIN_GAME",
			actorId: player2Id,
			payload: { playerId: player2Id, name: "Bob", role: "registered" },
		});
		engine1.dispatch({
			type: "JOIN_GAME",
			actorId: player3Id,
			payload: {
				playerId: player3Id,
				name: "Charlie",
				role: "registered",
			},
		});

		engine1.dispatch({
			type: "ADD_TEAM",
			actorId: ownerId,
			payload: { teamId: "team-red", name: "Red" },
		});
		engine1.dispatch({
			type: "ADD_TEAM",
			actorId: ownerId,
			payload: { teamId: "team-blue", name: "Blue" },
		});

		const engine2 = GameEngine.fromPrimitives(engine1.toPrimitives());
		engine2.dispatch({
			type: "MOVE_TO_TEAM",
			actorId: ownerId,
			payload: { playerId: ownerId, teamId: "team-red" },
		});
		engine2.dispatch({
			type: "MOVE_TO_TEAM",
			actorId: ownerId,
			payload: { playerId: player3Id, teamId: "team-red" },
		});
		engine2.dispatch({
			type: "MOVE_TO_TEAM",
			actorId: ownerId,
			payload: { playerId: player2Id, teamId: "team-blue" },
		});

		engine2.dispatch({
			type: "TOGGLE_READY",
			actorId: ownerId,
			payload: { playerId: ownerId },
		});
		engine2.dispatch({
			type: "TOGGLE_READY",
			actorId: player3Id,
			payload: { playerId: player3Id },
		});
		engine2.dispatch({
			type: "TOGGLE_READY",
			actorId: player2Id,
			payload: { playerId: player2Id },
		});

		engine2.dispatch({
			type: "START_GAME",
			actorId: ownerId,
		});

		const stateAfterStart = engine2.getState();
		expect(stateAfterStart.status).toBe("IN_PROGRESS");
		expect(stateAfterStart.currentRound).not.toBeNull();
		expect(stateAfterStart.currentRound?.explainerId).toBe(ownerId);

		// Start Round 1 (Red team, Alice is explainer)
		engine2.dispatch({
			type: "START_ROUND",
			actorId: ownerId,
			payload: { durationSeconds: 60, firstWordText: "CAT" },
		});

		const startEvents = engine2.pullDomainEvents();
		const roundStartedEvt = startEvents.find(
			(e): e is RoundStartedDomainEvent =>
				e instanceof RoundStartedDomainEvent,
		);
		expect(roundStartedEvt).toBeDefined();
		expect(roundStartedEvt?.explainerId).toBe(ownerId);

		// Guess 1 word (+1) -> total 1 (less than pointsToWin=2)
		engine2.dispatch({
			type: "WORD_GUESSED",
			actorId: ownerId,
			payload: { nextWordText: "DOG" },
		});
		engine2.dispatch({
			type: "START_POINTING",
			actorId: ownerId,
		});
		engine2.dispatch({
			type: "END_POINTING",
			actorId: ownerId,
		});

		expect(engine2.getState().status).toBe("IN_PROGRESS");
		const alicePlayer = engine2
			.getState()
			.players.find((p) => p.id === ownerId);
		expect(alicePlayer?.score).toBe(1);

		// Next round -> Blue team (Bob is explainer)
		engine2.dispatch({
			type: "NEXT_ROUND",
			actorId: ownerId,
		});
		expect(engine2.getState().currentRound?.teamId).toBe("team-blue");
		expect(engine2.getState().currentRound?.explainerId).toBe(player2Id);

		// Finish Blue round with 0 points
		engine2.dispatch({
			type: "START_ROUND",
			actorId: player2Id,
			payload: { durationSeconds: 60, firstWordText: "TREE" },
		});
		engine2.dispatch({
			type: "START_POINTING",
			actorId: ownerId,
		});
		engine2.dispatch({
			type: "END_POINTING",
			actorId: ownerId,
		});

		// Next round -> Back to Red team, explainer rotates from Alice (user-1) to Charlie (user-3)
		engine2.dispatch({
			type: "NEXT_ROUND",
			actorId: ownerId,
		});
		expect(engine2.getState().currentRound?.teamId).toBe("team-red");
		expect(engine2.getState().currentRound?.explainerId).toBe(player3Id);

		// Charlie guesses 1 word -> Red team reaches pointsToWin (2) on END_POINTING
		engine2.dispatch({
			type: "START_ROUND",
			actorId: player3Id,
			payload: { durationSeconds: 60, firstWordText: "SUN" },
		});
		engine2.dispatch({
			type: "WORD_GUESSED",
			actorId: player3Id,
			payload: { nextWordText: "MOON" },
		});
		engine2.dispatch({
			type: "START_POINTING",
			actorId: ownerId,
		});
		engine2.dispatch({
			type: "END_POINTING",
			actorId: ownerId,
		});

		expect(engine2.getState().status).toBe("FINISHED");
		expect(engine2.getState().winnerTeamId).toBe("team-red");
	});

	it("2. Emits domain events compatible with History and User event handlers", async () => {
		const mockHistoryRepo = {
			save: jest.fn().mockResolvedValue(undefined),
			updateGameState: jest.fn().mockResolvedValue(undefined),
			findAllByUserId: jest.fn(),
			findById: jest.fn(),
		};
		const mockHistoryRoundRepo = {
			save: jest.fn().mockResolvedValue(undefined),
			findAllByGameId: jest.fn(),
			findById: jest.fn(),
		};
		const mockUserRepo = {
			findManyByIds: jest.fn().mockResolvedValue([]),
			saveMany: jest.fn().mockResolvedValue(undefined),
		};

		const saveGameHandler = new SaveGameOnGameStartHandler(
			mockHistoryRepo as never,
		);
		const saveRoundHandler = new SaveRoundOnRoundFinishedHandler(
			mockHistoryRoundRepo as never,
		);
		const saveHistoryFinishedHandler = new SaveHistoryOnGameFinishedHandler(
			mockHistoryRepo as never,
		);
		const updateUserStatHandler = new UpdateUserStatOnGameFinishedHandler(
			mockUserRepo as never,
		);

		const engine = GameEngine.create("room-flow-2", ownerId, {
			settings: {
				...defaultSettings,
				pointsToWin: 1,
			},
			pointsToWin: 1,
			roundTimeSeconds: 60,
		});
		engine.dispatch({
			type: "JOIN_GAME",
			actorId: ownerId,
			payload: { playerId: ownerId, name: "Alice", role: "registered" },
		});
		engine.dispatch({
			type: "JOIN_GAME",
			actorId: player2Id,
			payload: { playerId: player2Id, name: "Bob", role: "registered" },
		});
		engine.dispatch({
			type: "ADD_TEAM",
			actorId: ownerId,
			payload: { teamId: "team-red", name: "Red" },
		});
		engine.dispatch({
			type: "ADD_TEAM",
			actorId: ownerId,
			payload: { teamId: "team-blue", name: "Blue" },
		});
		engine.dispatch({
			type: "MOVE_TO_TEAM",
			actorId: ownerId,
			payload: { playerId: ownerId, teamId: "team-red" },
		});
		engine.dispatch({
			type: "MOVE_TO_TEAM",
			actorId: ownerId,
			payload: { playerId: player2Id, teamId: "team-blue" },
		});
		engine.dispatch({
			type: "TOGGLE_READY",
			actorId: ownerId,
			payload: { playerId: ownerId },
		});
		engine.dispatch({
			type: "TOGGLE_READY",
			actorId: player2Id,
			payload: { playerId: player2Id },
		});

		engine.dispatch({ type: "START_GAME", actorId: ownerId });
		const startEvents = engine.pullDomainEvents();
		const gameStartedEvent = startEvents.find(
			(e) => e.name === GameStartedEvent.eventName,
		) as unknown as GameStartedEvent;
		expect(gameStartedEvent).toBeDefined();
		await expect(
			saveGameHandler.handle(gameStartedEvent),
		).resolves.not.toThrow();
		expect(mockHistoryRepo.save).toHaveBeenCalledTimes(1);

		engine.dispatch({
			type: "START_ROUND",
			actorId: ownerId,
			payload: { durationSeconds: 60, firstWordText: "STAR" },
		});
		engine.dispatch({
			type: "WORD_GUESSED",
			actorId: ownerId,
			payload: { nextWordText: "PLANET" },
		});
		engine.dispatch({
			type: "START_POINTING",
			actorId: ownerId,
		});
		engine.pullDomainEvents();

		engine.dispatch({
			type: "END_POINTING",
			actorId: ownerId,
		});

		const finishEvents = engine.pullDomainEvents();
		const roundFinishedEvent = finishEvents.find(
			(e) => e.name === RoundFinishedEvent.eventName,
		) as unknown as RoundFinishedEvent;
		const gameFinishedEvent = finishEvents.find(
			(e) => e.name === GameFinishedEvent.eventName,
		) as unknown as GameFinishedEvent;

		expect(roundFinishedEvent).toBeDefined();
		expect(gameFinishedEvent).toBeDefined();

		await expect(
			saveRoundHandler.handle(roundFinishedEvent),
		).resolves.not.toThrow();
		expect(mockHistoryRoundRepo.save).toHaveBeenCalledTimes(1);

		await expect(
			saveHistoryFinishedHandler.handle(gameFinishedEvent),
		).resolves.not.toThrow();
		expect(mockHistoryRepo.updateGameState).toHaveBeenCalledWith(
			engine.id,
			"FINISHED",
			"team-red",
			expect.any(Array),
		);

		await expect(
			updateUserStatHandler.execute(gameFinishedEvent),
		).resolves.not.toThrow();
	});
});
