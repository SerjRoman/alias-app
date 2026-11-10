import { GameEngine } from "../../../domain/engine/game-engine";
import { TransferOwnershipUseCase } from "./transfer-ownership.use-case";
import type { TransferOwnershipDto } from "../../dto/body";
import type { RoomFifoQueueService } from "../../room-fifo-queue.service";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import { GAME_UPDATED, PLAYERS_UPDATED } from "../../game.events";
import type { EventEmitter2 } from "@nestjs/event-emitter";
import type { UserDto } from "@common/dto/user.dto";

describe("TransferOwnershipUseCase", () => {
	let useCase: TransferOwnershipUseCase;
	let fifoQueue: RoomFifoQueueService;
	let gameSharedService: GameSharedService;
	let gameRepository: IGameRepository;
	let eventEmitter: EventEmitter2;

	let engine: GameEngine;

	beforeEach(() => {
		engine = GameEngine.fromPrimitives({
			id: "room-1",
			ownerId: "owner-1",
			status: "IN_PROGRESS",
			pointsToWin: 30,
			activeTeamId: "team-1",
			teams: [
				{ id: "team-1", name: "Team 1", color: "#FF0000", score: 0 },
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
					id: "p2",
					name: "Alice",
					role: "registered",
					teamId: "team-1",
					isReady: true,
					isOnline: true,
				},
			],
			bannedPlayerIds: [],
			addons: {},
			currentRound: null,
		});

		fifoQueue = {
			run: jest.fn((roomId: string, fn: () => Promise<any>) => fn()),
		} as unknown as RoomFifoQueueService;

		gameSharedService = {
			loadGame: jest.fn().mockResolvedValue(engine),
		} as unknown as GameSharedService;

		gameRepository = {
			saveGame: jest.fn().mockResolvedValue(undefined),
		} as unknown as IGameRepository;

		eventEmitter = {
			emit: jest.fn(),
		} as unknown as EventEmitter2;

		useCase = new TransferOwnershipUseCase(
			fifoQueue,
			gameSharedService,
			gameRepository,
			eventEmitter,
		);
	});

	it("dispatches TRANSFER_OWNERSHIP under room fifo lock and emits game & players notifications", async () => {
		const dto: TransferOwnershipDto = {
			roomId: "room-1",
			newOwnerId: "p2",
		};
		const actor: UserDto = {
			id: "owner-1",
			name: "Owner",
			role: "registered",
		};

		const result = await useCase.execute(dto, actor);

		expect(fifoQueue.run).toHaveBeenCalledWith(
			"room-1",
			expect.any(Function),
		);
		expect(engine.getState().ownerId).toBe("p2");
		expect(gameRepository.saveGame).toHaveBeenCalledWith(engine);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			GAME_UPDATED,
			expect.anything(),
		);
		expect(eventEmitter.emit).toHaveBeenCalledWith(
			PLAYERS_UPDATED,
			expect.anything(),
		);
		expect(result.ownerId).toBe("p2");
	});
});
