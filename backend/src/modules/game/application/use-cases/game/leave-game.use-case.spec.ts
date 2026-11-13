import { GameEngine } from "../../../domain/engine/game-engine";
import { LeaveGameUseCase } from "./leave-game.use-case";
import type { RoomFifoQueueService } from "../../room-fifo-queue.service";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { RoundScheduler } from "../../round-scheduler.service";
import type { UserDto } from "@common/dto/user.dto";

describe("LeaveGameUseCase", () => {
	let useCase: LeaveGameUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: GameSharedService;
	let gameRepository: IGameRepository;
	let eventEmitter: EventEmitter2;
	let roundScheduler: RoundScheduler;
	let engine: GameEngine;

	const ownerActor: UserDto = {
		id: "owner-1",
		name: "Owner",
		role: "registered",
	};

	const regularPlayerActor: UserDto = {
		id: "player-2",
		name: "Bob",
		role: "registered",
	};

	beforeEach(() => {
		engine = GameEngine.fromPrimitives({
			id: "room-1",
			ownerId: "owner-1",
			status: "LOBBY",
			pointsToWin: 30,
			activeTeamId: "team-1",
			teams: [
				{
					id: "team-1",
					name: "Team 1",
					color: "#FF0000",
					score: 0,
					playerIds: ["owner-1", "player-2"],
				},
			],
			players: [
				{
					id: "owner-1",
					name: "Owner",
					role: "registered",
					teamId: "team-1",
					isReady: true,
					isOnline: true,
				},
				{
					id: "player-2",
					name: "Bob",
					role: "registered",
					teamId: "team-1",
					isReady: true,
					isOnline: true,
				},
			],
			bannedPlayerIds: [],
			activeEffects: [],
			addons: {},
			currentRound: null,
		});

		fifoQueue = {
			run: jest.fn((_roomId: string, fn: () => Promise<any>) => fn()),
		} as unknown as RoomFifoQueueService;

		gameSharedService = {
			loadGame: jest.fn().mockResolvedValue(engine),
		} as unknown as GameSharedService;

		gameRepository = {
			saveGame: jest.fn().mockResolvedValue(undefined),
			removeUserRoom: jest.fn().mockResolvedValue(undefined),
		} as unknown as IGameRepository;

		eventEmitter = {
			emit: jest.fn(),
		} as unknown as EventEmitter2;

		roundScheduler = {
			clearOwnerTransferTimeout: jest.fn(),
			pauseRoundTimeout: jest.fn(),
		} as unknown as RoundScheduler;

		useCase = new LeaveGameUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
			roundScheduler,
		);
	});

	it("should clear owner transfer timeout when the owner leaves", async () => {
		await useCase.execute("room-1", ownerActor);

		expect(gameRepository.removeUserRoom).toHaveBeenCalledWith("owner-1");
		expect(roundScheduler.clearOwnerTransferTimeout).toHaveBeenCalledWith(
			"room-1",
		);
		// Ownership should have transferred in engine
		expect(engine.getState().ownerId).toBe("player-2");
	});

	it("should not clear owner transfer timeout when a regular player leaves", async () => {
		await useCase.execute("room-1", regularPlayerActor);

		expect(gameRepository.removeUserRoom).toHaveBeenCalledWith("player-2");
		expect(roundScheduler.clearOwnerTransferTimeout).not.toHaveBeenCalled();
		expect(engine.getState().ownerId).toBe("owner-1");
	});

	it("should pause round timeout if round is paused", async () => {
		engine = GameEngine.fromPrimitives({
			...engine.toPrimitives(),
			status: "IN_PROGRESS",
			currentRound: {
				id: "round-1",
				teamId: "team-1",
				explainerId: "player-2",
				roundNumber: 1,
				status: "IN_PROGRESS" as any,
				words: [],
				currentWord: null,
				expiresAt: Date.now() + 30000,
				pausedAt: Date.now(),
			},
		});
		(gameSharedService.loadGame as jest.Mock).mockResolvedValue(engine);

		await useCase.execute("room-1", regularPlayerActor);

		expect(roundScheduler.pauseRoundTimeout).toHaveBeenCalledWith("room-1");
	});

	it("should not maintain any stateful Map across calls or on failure", () => {
		expect(
			(useCase as unknown as Record<string, unknown>).wasOwnerByRoom,
		).toBeUndefined();
	});
});
