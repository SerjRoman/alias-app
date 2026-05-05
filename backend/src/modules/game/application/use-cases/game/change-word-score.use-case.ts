import type { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundNotActiveError } from "../../../domain/errors/round.errors";
import type { ChangeWordScoreDto } from "../../../dto/body";
import type { UserDto } from "../../../../auth/dto/user.dto";
import { ROUND_UPDATED, type RoundUpdatedPayload } from "../../game.events";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";

export class ChangeWordScoreUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async execute(dto: ChangeWordScoreDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);

		if (!room.currentRound) {
			throw new RoundNotActiveError();
		}

		room.assertRoundIsFinished();
		room.changeWordScore(dto.wordId, dto.delta, actor.id);
		await this.gameRepository.saveGame(room);

		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
	}
}
