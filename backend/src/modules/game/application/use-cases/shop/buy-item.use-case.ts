import { Injectable, Inject } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import type { UserDto } from "@common/dto/user.dto";
import type { BuyItemDto } from "../../dto/body";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import type { GameState } from "../../../domain/state/game.state";

@Injectable()
export class BuyItemUseCase extends RoomUseCase<BuyItemDto, GameState> {
	protected override readonly notify = ["game"] as const;

	constructor(
		fifoQueue: RoomFifoQueueService,
		gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		gameRepository: IGameRepository,
		eventEmitter: EventEmitter2,
	) {
		super(fifoQueue, gameSharedService, gameRepository, eventEmitter);
	}

	protected override handle(
		engine: GameEngine,
		dto: BuyItemDto,
		actor: UserDto,
	): GameState {
		engine.dispatch({
			type: "BUY_ITEM",
			actorId: actor.id,
			payload: {
				itemId: dto.itemId,
			},
		});

		return engine.toPrimitives();
	}
}
