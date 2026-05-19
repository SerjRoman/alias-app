import { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundNotActiveError } from "../../../domain/errors/round.errors";
import { ROUND_UPDATED, type RoundUpdatedPayload } from "../../game.events";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { ChangeWordScoreDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class ChangeWordScoreUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}

	async execute(dto: ChangeWordScoreDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);

		if (!room.currentRound) {
			throw new RoundNotActiveError();
		}

		room.assertRoundIsPointing();
		room.changeWordScore(dto.wordId, dto.delta, actor.id);
		await this.gameRepository.saveGame(room);

		const eventPayload: RoundUpdatedPayload = {
			round: room.currentRound.toPrimitives(),
			roomId: room.id,
		};
		this.eventEmitter.emit(ROUND_UPDATED, eventPayload);
	}
}
