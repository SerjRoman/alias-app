// TECH_DEBT: Вынести обработку таймаута раунда в отдельный метод, который будет вызываться как из планировщика, так и при форсированном старте раунда. Это позволит избежать дублирования кода и обеспечит более чистую архитектуру.
import { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundNotActiveError } from "../../../domain/errors/round.errors";
import { GameError } from "../../../domain/errors/game.errors";
import { GameSharedService } from "../../game-shared.service";
import { type RoundUpdatedPayload, ROUND_UPDATED } from "../../game.events";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../../game.repository.interface";
import { RoundScheduler } from "../../round-scheduler.service";
import { StartRoundDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { DictionaryService } from "../../dictionary.service";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class StartRoundForcedUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
		private readonly roundScheduler: RoundScheduler,
		private readonly dictionaryService: DictionaryService,
	) {}
	async execute(dto: StartRoundDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		if (!room.currentRound) {
			throw new RoundNotActiveError();
		}
		const startTime = Date.now();
		room.startRound(actor.id, startTime, true);
		this.roundScheduler.scheduleRoundTimeout(
			room.id,
			room.settings.roundTimeSeconds * 1000,
			() => {
				void this.handleRoundTimeout(room.id);
			},
		);
		const text = await this.dictionaryService.popWordForGame(room.id);
		if (!text) {
			throw new GameError(
				"Unexpected error: no words available for the game",
			);
		}

		room.nextWord(room.currentRound.guesserId, text, false);

		await this.gameRepository.saveGame(room);

		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
		return eventPayload;
	}

	private async handleRoundTimeout(roomId: string) {
		const room = await this.gameSharedService.loadGame(roomId);
		if (!room.currentRound) {
			throw new RoundNotActiveError();
		}

		room.startPointing();
		await this.gameRepository.saveGame(room);

		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
	}
}
