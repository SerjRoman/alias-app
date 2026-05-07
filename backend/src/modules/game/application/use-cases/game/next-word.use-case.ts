import type { EventEmitter2 } from "@nestjs/event-emitter";
import { RoundNotActiveError } from "../../../domain/errors/round.errors";
import type { NextWordDto } from "../../../dto/body";
import type { UserDto } from "../../../../user/application/dto/user.dto";
import { ROUND_UPDATED, type RoundUpdatedPayload } from "../../game.events";
import type { GameSharedService } from "../../game-shared.service";
import type { IGameRepository } from "../../game.repository.interface";
import type { DictionaryService } from "../../dictionary.service";

export class NextWordUseCase {
    constructor(
        private readonly gameSharedService: GameSharedService,
        private readonly gameRepository: IGameRepository,
        private readonly eventEmitter: EventEmitter2,
        private readonly dictionaryService: DictionaryService,
    ) { }

    async execute(dto: NextWordDto, actor: UserDto) {
        const room = await this.gameSharedService.loadGame(dto.roomId);

        if (!room.currentRound) {
            throw new RoundNotActiveError();
        }

        room.assertRoundInProgress();
        room.assertIsGuesser(actor.id);

        if (room.currentRound.currentWord !== null) {
            this.dictionaryService.popWordForGame(room.id);
        }

        const text = await this.gameSharedService.getWordForGameSession(room);
        const newWord = room.nextWord(actor.id, text, dto.wasSkipped);
        await this.gameSharedService.checkAndSetWordsForGame(room);
        await this.gameRepository.saveGame(room);

        const eventPayload: RoundUpdatedPayload = {
            round: room.currentRound.toPrimitives(),
            roomId: room.id,
        };
        this.eventEmitter.emit(ROUND_UPDATED, eventPayload);

        return { newWord };
    }
}
