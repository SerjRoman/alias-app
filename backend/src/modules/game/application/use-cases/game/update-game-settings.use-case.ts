import { UserDto } from "@common/dto/user.dto";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { UpdateGameSettingsDto } from "../../dto/body";
import { Injectable, Inject, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DictionaryService } from "../../dictionary.service";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import type { GameState } from "../../../domain/state/game.state";

interface UpdateGameSettingsContext extends Record<string, unknown> {
	shouldClearWords?: boolean;
}

@Injectable()
export class UpdateGameSettingsUseCase extends RoomUseCase<
	UpdateGameSettingsDto,
	GameState,
	UpdateGameSettingsContext
> {
	private readonly logger = new Logger(UpdateGameSettingsUseCase.name);
	protected override readonly notify = [
		"settings",
		"players",
		"game",
	] as const;

	constructor(
		fifoQueue: RoomFifoQueueService,
		gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		gameRepository: IGameRepository,
		eventEmitter: EventEmitter2,
		private readonly dictionaryService: DictionaryService,
	) {
		super(fifoQueue, gameSharedService, gameRepository, eventEmitter);
	}

	protected override beforeHandle(
		engine: GameEngine,
		dto: UpdateGameSettingsDto,
		_actor: UserDto,
		context: UpdateGameSettingsContext,
	): void {
		const prevSettings = engine.getState().settings;
		const hatModeChanged =
			dto.isHatMode !== undefined &&
			dto.isHatMode !== prevSettings?.isHatMode;
		const wordsPerPlayerChanged =
			dto.wordsPerPlayer !== undefined &&
			dto.wordsPerPlayer !== prevSettings?.wordsPerPlayer;
		context.shouldClearWords = hatModeChanged || wordsPerPlayerChanged;
	}

	protected override handle(
		engine: GameEngine,
		dto: UpdateGameSettingsDto,
		actor: UserDto,
	): void {
		const settingsToUpdate = { ...dto };
		delete (settingsToUpdate as { roomId?: string }).roomId;
		engine.dispatch({
			type: "UPDATE_SETTINGS",
			actorId: actor.id,
			payload: settingsToUpdate,
		});
	}

	protected override async afterCommit(
		engine: GameEngine,
		_dto: UpdateGameSettingsDto,
		_actor: UserDto,
		_result: GameState | void,
		context: UpdateGameSettingsContext,
	): Promise<void> {
		if (context.shouldClearWords) {
			const playerIds = engine.toPrimitives().players.map((p) => p.id);
			await Promise.all(
				playerIds.map((playerId) =>
					this.dictionaryService
						.clearCustomWordsForPlayer(engine.id, playerId)
						.catch((err) =>
							this.logger.error(
								`Failed to clear custom words for player ${playerId} on settings update`,
								err,
							),
						),
				),
			);
		}
	}
}
