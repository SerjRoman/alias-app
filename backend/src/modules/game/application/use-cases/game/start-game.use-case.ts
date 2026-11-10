import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { DictionaryService } from "../../dictionary.service";
import { GAME_STARTED, type GameStartedPayload } from "../../game.events";
import { UserDto } from "@common/dto/user.dto";
import { Injectable, Inject } from "@nestjs/common";
import { RoomFifoQueueService } from "../../room-fifo-queue.service";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import type { GameState } from "../../../domain";

@Injectable()
export class StartGameUseCase extends RoomUseCase<string, GameState> {
	protected override readonly notify = [] as const;

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

	protected override async handle(
		engine: GameEngine,
		roomId: string,
		actor: UserDto,
	): Promise<GameState> {
		engine.dispatch({
			type: "START_GAME",
			actorId: actor.id,
		});

		const state = engine.getState();
		const isHatMode = state.settings?.isHatMode ?? false;
		const wordPackSelections = state.settings?.wordPackSelections ?? [];

		if (isHatMode) {
			const playerIds = state.players.map((p) => p.id);
			await this.dictionaryService.loadShuffledCustomWords(
				roomId,
				playerIds,
				wordPackSelections,
			);
		} else {
			await this.dictionaryService.loadGameWords(
				roomId,
				wordPackSelections,
			);
		}

		return engine.toPrimitives();
	}

	protected override afterCommit(engine: GameEngine): void {
		const eventPayload: GameStartedPayload = {
			room: engine.toPrimitives(),
		};
		this.eventEmitter.emit(GAME_STARTED, eventPayload);
	}
}
