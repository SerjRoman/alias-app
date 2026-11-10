import { EventEmitter2 } from "@nestjs/event-emitter";
import { RoomFifoQueueService } from "../room-fifo-queue.service";
import { GameSharedService } from "../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../game.repository.interface";
import { UserDto } from "@common/dto/user.dto";
import type { GameEngine } from "../../domain/engine/game-engine";
import type { GameState } from "../../domain/state/game.state";
import {
	GAME_UPDATED,
	TEAMS_UPDATED,
	PLAYERS_UPDATED,
	ROUND_UPDATED,
	GAME_SETTINGS_UPDATED,
} from "../game.events";
import { Inject } from "@nestjs/common";

export type RoomNotification =
	| "game"
	| "teams"
	| "players"
	| "round"
	| "settings";

/**
 * Base abstract class for room operations.
 * Handles the standard pipeline:
 * 1. Lock room queue (FIFO per room)
 * 2. Load GameEngine from repository via GameSharedService
 * 3. Execute optional beforeHandle hook
 * 4. Execute abstract handle method
 * 5. Save GameEngine to repository
 * 6. Publish declared notifications via EventEmitter2
 * 7. Execute optional afterCommit hook
 * 8. Return handle result or engine.toPrimitives()
 */
export abstract class RoomUseCase<
	TDto extends { roomId?: string } | string,
	TResult = GameState,
	TContext extends Record<string, unknown> = Record<string, unknown>,
> {
	protected notify: readonly RoomNotification[] = ["game"];
	protected skipSave = false;

	constructor(
		protected readonly fifoQueue: RoomFifoQueueService,
		protected readonly gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		protected readonly gameRepository: IGameRepository,
		protected readonly eventEmitter: EventEmitter2,
	) {}

	protected extractRoomId(dto: TDto): string {
		if (typeof dto === "string") return dto;
		if (
			dto &&
			typeof dto === "object" &&
			"roomId" in dto &&
			typeof dto.roomId === "string"
		) {
			return dto.roomId;
		}
		throw new Error("Cannot extract roomId from DTO");
	}

	async execute(dto: TDto, actor: UserDto): Promise<TResult> {
		const roomId = this.extractRoomId(dto);
		return this.fifoQueue.run(roomId, async () => {
			const engine = await this.gameSharedService.loadGame(roomId);
			const context = {} as TContext;
			await this.beforeHandle?.(engine, dto, actor, context);
			const result = await this.handle(engine, dto, actor, context);
			if (!this.skipSave) {
				await this.gameRepository.saveGame(engine);
			}
			this.publishNotifications(engine);
			await this.afterCommit?.(engine, dto, actor, result, context);
			return (
				result !== undefined ? result : engine.toPrimitives()
			) as TResult;
		});
	}

	protected abstract handle(
		engine: GameEngine,
		dto: TDto,
		actor: UserDto,
		context: TContext,
	): Promise<TResult | void> | TResult | void;

	protected beforeHandle?(
		engine: GameEngine,
		dto: TDto,
		actor: UserDto,
		context: TContext,
	): Promise<void> | void;

	protected afterCommit?(
		engine: GameEngine,
		dto: TDto,
		actor: UserDto,
		result: TResult | void,
		context: TContext,
	): Promise<void> | void;

	protected publishNotifications(engine: GameEngine): void {
		const state = engine.toPrimitives();
		for (const n of this.notify) {
			switch (n) {
				case "game":
					this.eventEmitter.emit(GAME_UPDATED, { room: state });
					break;
				case "teams":
					this.eventEmitter.emit(TEAMS_UPDATED, {
						roomId: state.id,
						teams: state.teams,
					});
					break;
				case "players":
					this.eventEmitter.emit(PLAYERS_UPDATED, {
						roomId: state.id,
						players: state.players,
					});
					break;
				case "round":
					if (state.currentRound) {
						this.eventEmitter.emit(ROUND_UPDATED, {
							roomId: state.id,
							round: state.currentRound,
						});
					}
					break;
				case "settings":
					this.eventEmitter.emit(GAME_SETTINGS_UPDATED, {
						roomId: state.id,
						settings: state.settings,
					});
					break;
			}
		}
	}
}
