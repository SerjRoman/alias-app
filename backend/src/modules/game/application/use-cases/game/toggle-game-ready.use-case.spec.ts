import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { ToggleReadyUseCase } from "./toggle-game-ready.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import type { GameState } from "../../../domain";
import { PLAYERS_UPDATED } from "../../game.events";

describe("ToggleReadyUseCase (with Addon Pipeline & FIFO Queue) - TDD", () => {
	let useCase: ToggleReadyUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let repository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;

	const roomId = "room-123";
	const playerId = "player-1";
	const actor: UserDto = {
		id: playerId,
		name: "Alice",
		role: "registered",
	};

	const createTestEngine = (overrides?: Partial<GameState>): GameEngine => {
		const state: GameState = {
			id: roomId,
			ownerId: "owner-1",
			status: "LOBBY",
			pointsToWin: 30,
			teams: [
				{ id: "team-1", name: "Red", color: "#FF0000", score: 0 },
				{ id: "team-2", name: "Blue", color: "#0000FF", score: 0 },
			],
			players: [
				{
					id: playerId,
					name: "Alice",
					teamId: "team-1",
					isReady: false,
				},
				{ id: "p2", name: "Bob", teamId: "team-2", isReady: true },
			],
			bannedPlayerIds: [],
			activeTeamId: null,
			currentRound: null,
			activeEffects: [],
			addons: {},
			...overrides,
		};
		return GameEngine.fromPrimitives(state);
	};

	beforeEach(() => {
		fifoQueue = new RoomFifoQueueService();

		gameSharedService = {
			loadGame: jest.fn(),
		} as unknown as jest.Mocked<GameSharedService>;

		repository = {
			saveGame: jest.fn().mockResolvedValue(undefined),
			findGameById: jest.fn(),
			findAllGames: jest.fn(),
			deleteGame: jest.fn(),
			setGameTtl: jest.fn(),
			setUserRoom: jest.fn(),
			getUserRoom: jest.fn(),
			removeUserRoom: jest.fn(),
			removeUserRooms: jest.fn(),
		} as unknown as jest.Mocked<IGameRepository>;

		eventEmitter = {
			emit: jest.fn(),
		} as unknown as jest.Mocked<EventEmitter2>;

		useCase = new ToggleReadyUseCase(
			fifoQueue,
			gameSharedService,
			repository,
			eventEmitter,
		);
	});

	it("successfully toggles ready from false to true, saves, and emits PLAYERS_UPDATED", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const result = await useCase.execute(roomId, actor);

		// Verified player isReady toggled to true
		const player = engine.getState().players.find((p) => p.id === playerId);
		expect(player?.isReady).toBe(true);

		// Saved state
		expect(repository.saveGame).toHaveBeenCalledWith(engine);

		// PLAYERS_UPDATED emitted
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			PLAYERS_UPDATED,
			expect.objectContaining({
				roomId,
				players: expect.arrayContaining([
					expect.objectContaining({ id: playerId, isReady: true }),
				]),
			}),
		);

		expect(result.players[0].isReady).toBe(true);
	});

	it("throws error if game is not in LOBBY", async () => {
		const engine = createTestEngine({ status: "IN_PROGRESS" });
		gameSharedService.loadGame.mockResolvedValue(engine);

		await expect(useCase.execute(roomId, actor)).rejects.toThrow(
			"Cannot toggle ready: game not in lobby",
		);
		expect(repository.saveGame).not.toHaveBeenCalled();
	});

	it("throws error if player is not found in the game", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const stranger: UserDto = {
			id: "unknown-user",
			name: "Stranger",
			role: "anonymous",
		};

		await expect(useCase.execute(roomId, stranger)).rejects.toThrow(
			"Player unknown-user not found",
		);
	});
});
