import type { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundNotActiveError } from "../../../domain/errors/round.errors";
import type { StartRoundDto } from "../../../dto/body";
import type { GameSharedService } from "../../game-shared.service";
import { type RoundUpdatedPayload, ROUND_UPDATED } from "../../game.events";
import type { IGameRepository } from "../../game.repository.interface";
import type { RoundScheduler } from "../../round-scheduler.service";

export class StartRoundUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
		private readonly roundScheduler: RoundScheduler,
	) {}
	async execute(dto: StartRoundDto, actorId: string) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		if (!room.currentRound) {
			throw new RoundNotActiveError();
		}
		const startTime = Date.now();
		room.startRound(actorId, startTime);
		this.roundScheduler.scheduleRoundTimeout(
			room.id,
			room.settings.roundTimeSeconds * 1000,
			() => {
				void this.handleRoundTimeout(room.id);
			},
		);
		const text = await this.gameSharedService.getWordForGameSession(room);

		await this.gameSharedService.checkAndSetWordsForGame(room);
		const word = room.nextWord(actorId, text, false);

		await this.gameRepository.saveGame(room);

		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
		return { word };
	}

	private async handleRoundTimeout(roomId: string) {
		const room = await this.gameSharedService.loadGame(roomId);
		if (!room.currentRound) {
			throw new RoundNotActiveError();
		}

		await this.gameSharedService.checkAndSetWordsForGame(room);
		room.finishRound();
		await this.gameRepository.saveGame(room);

		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
	}
}
