import type { EventEmitter2 } from "@nestjs/event-emitter";
import { RoomFifoQueueService } from "../room-fifo-queue.service";
import type { GameSharedService } from "../game-shared.service";
import type { IGameRepository } from "../game.repository.interface";
import type { UserDto } from "@common/dto/user.dto";
import { GameEngine } from "../../domain/engine/game-engine";
import { RoomUseCase, type RoomNotification } from "./room.use-case";
import {
	GAME_UPDATED,
	TEAMS_UPDATED,
	PLAYERS_UPDATED,
	ROUND_UPDATED,
	GAME_SETTINGS_UPDATED,
} from "../game.events";
import { RoundStatus } from "../../domain/state/game.state";

class TestRoomUseCase extends RoomUseCase<
	{ roomId: string; value?: string },
	{ id?: string; custom?: string } | undefined
> {
	public handleCallOrder: string[] = [];
	public customResult: { id?: string; custom?: string } | undefined =
		undefined;

	public setNotify(notifications: readonly RoomNotification[]) {
		this.notify = notifications;
	}

	protected override beforeHandle() {
		this.handleCallOrder.push("beforeHandle");
	}

	protected override handle(
		_engine: GameEngine,
		dto: { roomId: string; value?: string },
	) {
		this.handleCallOrder.push("handle");
		if (dto.value === "throw") {
			throw new Error("Handle error");
		}
		return this.customResult;
	}

	protected override afterCommit() {
		this.handleCallOrder.push("afterCommit");
	}
}

class StringDtoRoomUseCase extends RoomUseCase<
	string,
	{ handledRoomId: string }
> {
	protected override handle(_engine: GameEngine, roomId: string) {
		return { handledRoomId: roomId };
	}
}

describe("RoomUseCase", () => {
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: jest.Mocked<GameSharedService>;
	let gameRepository: jest.Mocked<IGameRepository>;
	let eventEmitter: jest.Mocked<EventEmitter2>;
	let mockEngine: GameEngine;

	const mockActor: UserDto = {
		id: "user-1",
		name: "Alice",
		role: "registered",
	};

	beforeEach(() => {
		fifoQueue = new RoomFifoQueueService();
		mockEngine = GameEngine.create("room-123", "user-1", {
			teams: [
				{
					id: "team-1",
					name: "Team 1",
					color: "#f00",
					score: 0,
					playerIds: ["user-1"],
				},
			],
			players: [
				{
					id: "user-1",
					name: "Alice",
					role: "registered",
					score: 0,
					isReady: false,
					isRoundReady: false,
					isOnline: true,
					submittedWordsCount: 0,
					teamId: "team-1",
				},
			],
			currentRound: {
				id: "round-1",
				teamId: "team-1",
				explainerId: "user-1",
				roundNumber: 1,
				status: RoundStatus.IN_PROGRESS,
				words: [],
				currentWord: null,
				expiresAt: 1000,
			},
		});

		gameSharedService = {
			loadGame: jest.fn().mockResolvedValue(mockEngine),
			generateRoomCode: jest.fn(),
			validateCode: jest.fn(),
		} as unknown as jest.Mocked<GameSharedService>;

		gameRepository = {
			findGameById: jest.fn(),
			findAllGames: jest.fn(),
			saveGame: jest.fn().mockImplementation(async () => {
				// Record save
			}),
			deleteGame: jest.fn(),
			setGameTtl: jest.fn(),
			setUserRoom: jest.fn(),
			getUserRoom: jest.fn(),
			removeUserRoom: jest.fn(),
			removeUserRooms: jest.fn(),
		};

		eventEmitter = {
			emit: jest.fn(),
		} as unknown as jest.Mocked<EventEmitter2>;
	});

	it("should run inside fifoQueue with roomId extracted from object DTO", async () => {
		const useCase = new TestRoomUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
		);
		const runSpy = jest.spyOn(fifoQueue, "run");

		const result = await useCase.execute({ roomId: "room-123" }, mockActor);

		expect(runSpy).toHaveBeenCalledWith("room-123", expect.any(Function));
		expect(gameSharedService.loadGame).toHaveBeenCalledWith("room-123");
		expect(result?.id).toBe("room-123");
	});

	it("should run inside fifoQueue with roomId extracted from string DTO", async () => {
		const useCase = new StringDtoRoomUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
		);
		const runSpy = jest.spyOn(fifoQueue, "run");

		const result = await useCase.execute("room-123", mockActor);

		expect(runSpy).toHaveBeenCalledWith("room-123", expect.any(Function));
		expect(result).toEqual({ handledRoomId: "room-123" });
	});

	it("should execute hooks and save in exact order: beforeHandle -> handle -> saveGame -> publish -> afterCommit", async () => {
		const useCase = new TestRoomUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
		);

		gameRepository.saveGame.mockImplementation(() => {
			useCase.handleCallOrder.push("saveGame");
			return Promise.resolve();
		});

		eventEmitter.emit.mockImplementation((event: string) => {
			useCase.handleCallOrder.push(`emit:${event}`);
			return true;
		});

		await useCase.execute({ roomId: "room-123" }, mockActor);

		expect(useCase.handleCallOrder).toEqual([
			"beforeHandle",
			"handle",
			"saveGame",
			"emit:game.updated",
			"afterCommit",
		]);
	});

	it("should emit correct events for all configured notifications in notify list", async () => {
		const useCase = new TestRoomUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
		);
		useCase.setNotify(["game", "teams", "players", "round", "settings"]);

		await useCase.execute({ roomId: "room-123" }, mockActor);

		expect(eventEmitter.emit).toHaveBeenCalledWith(GAME_UPDATED, {
			room: mockEngine.toPrimitives(),
		});
		expect(eventEmitter.emit).toHaveBeenCalledWith(TEAMS_UPDATED, {
			roomId: "room-123",
			teams: mockEngine.toPrimitives().teams,
		});
		expect(eventEmitter.emit).toHaveBeenCalledWith(PLAYERS_UPDATED, {
			roomId: "room-123",
			players: mockEngine.toPrimitives().players,
		});
		expect(eventEmitter.emit).toHaveBeenCalledWith(ROUND_UPDATED, {
			roomId: "room-123",
			round: mockEngine.toPrimitives().currentRound,
		});
		expect(eventEmitter.emit).toHaveBeenCalledWith(GAME_SETTINGS_UPDATED, {
			roomId: "room-123",
			settings: mockEngine.toPrimitives().settings,
		});
	});

	it("should return custom result if returned from handle", async () => {
		const useCase = new TestRoomUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
		);
		useCase.customResult = { custom: "data" };

		const result = await useCase.execute({ roomId: "room-123" }, mockActor);

		expect(result).toEqual({ custom: "data" });
	});

	it("should return engine.toPrimitives() if handle returns undefined", async () => {
		const useCase = new TestRoomUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
		);

		const result = await useCase.execute({ roomId: "room-123" }, mockActor);

		expect(result).toEqual(mockEngine.toPrimitives());
	});

	it("should bubble up error and not save or emit if handle throws", async () => {
		const useCase = new TestRoomUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
		);

		await expect(
			useCase.execute({ roomId: "room-123", value: "throw" }, mockActor),
		).rejects.toThrow("Handle error");

		expect(gameRepository.saveGame).not.toHaveBeenCalled();
		expect(eventEmitter.emit).not.toHaveBeenCalled();
	});

	it("should pass context across beforeHandle, handle and afterCommit", async () => {
		interface CustomContext extends Record<string, unknown> {
			stepTrace?: string[];
		}

		class ContextTestUseCase extends RoomUseCase<
			{ roomId: string },
			any,
			CustomContext
		> {
			public capturedContext: CustomContext = {};

			protected override beforeHandle(
				_engine: GameEngine,
				_dto: any,
				_actor: UserDto,
				context: CustomContext,
			) {
				context.stepTrace = ["before"];
			}

			protected override handle(
				_engine: GameEngine,
				_dto: any,
				_actor: UserDto,
				context: CustomContext,
			) {
				context.stepTrace?.push("handle");
			}

			protected override afterCommit(
				_engine: GameEngine,
				_dto: any,
				_actor: UserDto,
				_result: any,
				context: CustomContext,
			) {
				context.stepTrace?.push("after");
				this.capturedContext = context;
			}
		}

		const useCase = new ContextTestUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
		);

		await useCase.execute({ roomId: "room-123" }, mockActor);

		expect(useCase.capturedContext.stepTrace).toEqual([
			"before",
			"handle",
			"after",
		]);
	});
});
