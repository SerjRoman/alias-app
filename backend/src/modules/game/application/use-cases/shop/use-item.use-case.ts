import { Injectable, Inject } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import type { UserDto } from "@common/dto/user.dto";
import type { UseItemDto } from "../../dto/body";
import { RoundScheduler } from "../../round-scheduler.service";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import type { ActiveEffect, GameState } from "../../../domain/state/game.state";

interface UseItemContext extends Record<string, unknown> {
	timedEffect?: ActiveEffect;
}

@Injectable()
export class UseItemUseCase extends RoomUseCase<
	UseItemDto,
	GameState,
	UseItemContext
> {
	protected override readonly notify = ["game"] as const;

	constructor(
		fifoQueue: RoomFifoQueueService,
		gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		gameRepository: IGameRepository,
		eventEmitter: EventEmitter2,
		private readonly roundScheduler: RoundScheduler,
	) {
		super(fifoQueue, gameSharedService, gameRepository, eventEmitter);
	}

	protected override handle(
		engine: GameEngine,
		dto: UseItemDto,
		actor: UserDto,
		context: UseItemContext,
	): GameState {
		const existingEffectIds = new Set(
			engine.getState().activeEffects.map((e: ActiveEffect) => e.id),
		);

		engine.dispatch({
			type: "USE_ITEM",
			actorId: actor.id,
			payload: {
				inventoryItemId: dto.inventoryItemId,
				targetTeamId: dto.targetTeamId,
				targetPlayerId: dto.targetPlayerId,
			},
		});

		const currentEffects = engine.getState().activeEffects;
		const newEffect = currentEffects.find(
			(e: ActiveEffect) => !existingEffectIds.has(e.id),
		);

		if (
			newEffect?.status === "ACTIVE" &&
			newEffect.expiresAt &&
			newEffect.expiresAt > Date.now()
		) {
			context.timedEffect = newEffect;
		}

		return engine.toPrimitives();
	}

	protected override afterCommit(
		_engine: GameEngine,
		dto: UseItemDto,
		_actor: UserDto,
		_result: GameState | void,
		context: UseItemContext,
	): void {
		const effect = context.timedEffect;
		if (!effect?.expiresAt) {
			return;
		}

		const remainingMs = Math.max(0, effect.expiresAt - Date.now());
		const effectId = effect.id;

		this.roundScheduler.scheduleEffectTimeout(
			dto.roomId,
			effectId,
			remainingMs,
			() => this.handleEffectTimeout(dto.roomId, effectId),
		);
	}

	private async handleEffectTimeout(
		roomId: string,
		effectId: string,
	): Promise<void> {
		await this.fifoQueue.run(roomId, async () => {
			const engine = await this.gameSharedService.loadGame(roomId);
			engine.expireEffect(effectId);
			await this.gameRepository.saveGame(engine);
		});
	}
}
