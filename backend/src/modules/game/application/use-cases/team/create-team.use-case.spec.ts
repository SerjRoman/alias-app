import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";
import type { CreateTeamDto } from "../../dto/body";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { CreateTeamUseCase } from "./create-team.use-case";
import { GameEngine } from "../../../domain/engine/game-engine";
import type { GameState } from "../../../domain";
import { TEAMS_UPDATED } from "../../game.events";

describe("CreateTeamUseCase (with Addon Pipeline & FIFO Queue) - TDD", () => {
	let useCase: CreateTeamUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let repository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;

	const roomId = "room-123";
	const ownerId = "owner-1";
	const actorOwner: UserDto = {
		id: ownerId,
		name: "Alice",
		role: "registered",
	};

	const createTestEngine = (overrides?: Partial<GameState>): GameEngine => {
		const state: GameState = {
			id: roomId,
			ownerId,
			status: "LOBBY",
			pointsToWin: 30,
			teams: [{ id: "team-1", name: "Red", color: "#FF0000", score: 0 }],
			players: [
				{
					id: ownerId,
					name: "Alice",
					teamId: "team-1",
					isReady: true,
				},
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

		useCase = new CreateTeamUseCase(
			fifoQueue,
			gameSharedService,
			repository,
			eventEmitter,
		);
	});

	it("successfully creates a new team, saves state, and emits TEAMS_UPDATED", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: CreateTeamDto = { roomId, teamName: "Blue" };
		const result = await useCase.execute(dto, actorOwner);

		// Teams list now contains Blue
		expect(engine.getState().teams).toHaveLength(2);
		expect(engine.getState().teams[1].name).toBe("Blue");
		expect(engine.getState().teams[1].id).toBeDefined();

		// State saved
		expect(repository.saveGame).toHaveBeenCalledWith(engine);

		// TEAMS_UPDATED emitted
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			TEAMS_UPDATED,
			expect.objectContaining({
				roomId,
				teams: expect.arrayContaining([
					expect.objectContaining({ name: "Blue" }),
				]),
			}),
		);

		expect(result.teams).toHaveLength(2);
	});

	it("throws error if team name is already taken", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: CreateTeamDto = { roomId, teamName: "red" }; // case-insensitive check
		await expect(useCase.execute(dto, actorOwner)).rejects.toThrow(
			'Team name "red" is already taken',
		);
		expect(repository.saveGame).not.toHaveBeenCalled();
	});

	it("throws error if actor is not the room owner", async () => {
		const engine = createTestEngine();
		gameSharedService.loadGame.mockResolvedValue(engine);

		const notOwner: UserDto = {
			id: "intruder",
			name: "Eve",
			role: "registered",
		};

		const dto: CreateTeamDto = { roomId, teamName: "Yellow" };
		await expect(useCase.execute(dto, notOwner)).rejects.toThrow(
			"Only room owner can add teams",
		);
		expect(repository.saveGame).not.toHaveBeenCalled();
	});

	it("allows owner to add team during IN_PROGRESS", async () => {
		const engine = createTestEngine({ status: "IN_PROGRESS" });
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: CreateTeamDto = { roomId, teamName: "Green" };
		const result = await useCase.execute(dto, actorOwner);

		expect(result.teams).toHaveLength(2);
		expect(repository.saveGame).toHaveBeenCalled();
	});

	it("throws error if game is in FINISHED status", async () => {
		const engine = createTestEngine({ status: "FINISHED" });
		gameSharedService.loadGame.mockResolvedValue(engine);

		const dto: CreateTeamDto = { roomId, teamName: "Green" };
		await expect(useCase.execute(dto, actorOwner)).rejects.toThrow(
			"Cannot add team: game is already finished",
		);
	});
});
