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
import { DictionaryService } from "../../dictionary.service";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import {
	RoundStatus,
	type ActiveEffect,
	type GameState,
} from "../../../domain/state/game.state";
import { ShopService } from "../../../domain/shop";

interface UseItemContext extends Record<string, unknown> {
	timedEffect?: ActiveEffect;
	roundTimeDeltaMs?: number;
	cancelledEffectIds?: string[];
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
		private readonly dictionaryService: DictionaryService,
	) {
		super(fifoQueue, gameSharedService, gameRepository, eventEmitter);
	}

	protected override async handle(
		engine: GameEngine,
		dto: UseItemDto,
		actor: UserDto,
		context: UseItemContext,
	): Promise<GameState> {
		const prevState = engine.getState();
		const existingEffectIds = new Set(
			prevState.activeEffects.map((e: ActiveEffect) => e.id),
		);
		const activeTimedEffectIds = prevState.activeEffects
			.filter(
				(e: ActiveEffect) =>
					e.status !== "CONSUMED" && e.expiresAt !== undefined,
			)
			.map((e: ActiveEffect) => e.id);

		const inventoryItem = ShopService.getInventory(
			prevState,
			actor.id,
		).find((item) => item.id === dto.inventoryItemId);

		const prevRound = prevState.currentRound;
		const prevExpiresAt = prevRound?.expiresAt;
		const prevRemainingMs = prevRound?.remainingMs;

		let nextWordText: string | undefined;
		if (
			inventoryItem?.itemId === "REROLL_WORD" &&
			prevRound?.status === RoundStatus.IN_PROGRESS
		) {
			nextWordText =
				(await this.dictionaryService.popWordForGame(dto.roomId)) ??
				undefined;
		}

		engine.dispatch({
			type: "USE_ITEM",
			actorId: actor.id,
			payload: {
				inventoryItemId: dto.inventoryItemId,
				targetTeamId: dto.targetTeamId,
				targetPlayerId: dto.targetPlayerId,
				nextWordText,
			},
		});

		const nextState = engine.getState();
		const currentEffects = nextState.activeEffects;
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

		if (
			inventoryItem?.itemId === "EXTRA_TIME" ||
			inventoryItem?.itemId === "TIME_DRAIN"
		) {
			const nextRound = nextState.currentRound;
			if (nextRound?.pausedAt != null && prevRemainingMs != null) {
				context.roundTimeDeltaMs =
					(nextRound.remainingMs ?? 0) - prevRemainingMs;
			} else if (nextRound && prevExpiresAt != null) {
				context.roundTimeDeltaMs = nextRound.expiresAt - prevExpiresAt;
			}
		}

		if (inventoryItem?.itemId === "CLEANSE") {
			context.cancelledEffectIds = activeTimedEffectIds.filter((id) => {
				const eff = currentEffects.find((e) => e.id === id);
				return eff?.status === "CONSUMED";
			});
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
		if (
			context.roundTimeDeltaMs !== undefined &&
			context.roundTimeDeltaMs !== 0
		) {
			this.roundScheduler.changeRoundTime(
				dto.roomId,
				context.roundTimeDeltaMs,
			);
		}

		if (context.cancelledEffectIds?.length) {
			for (const effectId of context.cancelledEffectIds) {
				this.roundScheduler.clearEffectTimeout(dto.roomId, effectId);
			}
		}

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
