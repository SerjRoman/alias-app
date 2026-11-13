import { Injectable, Inject } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { plainToInstance } from "class-transformer";
import { UserDto } from "@common/dto/user.dto";
import { GameStatus, RoundStatus } from "../../../domain";
import type { GameEngine } from "../../../domain/engine/game-engine";
import { RoomUseCase, type RoomNotification } from "../room.use-case";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { GetExplainerWordDto } from "../../dto/body/get-explainer-word.dto";
import { ExplainerWordResponseDto } from "../../dto/response/explainer-word-response.dto";

@Injectable()
export class GetExplainerWordUseCase extends RoomUseCase<
	GetExplainerWordDto,
	ExplainerWordResponseDto | null
> {
	protected override readonly notify: readonly RoomNotification[] = [];
	protected override readonly skipSave = true;

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
		_dto: GetExplainerWordDto,
		actor: UserDto,
	): ExplainerWordResponseDto | null {
		const state = engine.getState();

		const isExplainer =
			state.status === GameStatus.IN_PROGRESS &&
			state.currentRound?.status === RoundStatus.IN_PROGRESS &&
			state.currentRound?.explainerId === actor.id;

		if (!isExplainer || !state.currentRound?.currentWord) {
			return null;
		}

		return plainToInstance(
			ExplainerWordResponseDto,
			state.currentRound.currentWord,
			{ excludeExtraneousValues: true },
		);
	}
}
