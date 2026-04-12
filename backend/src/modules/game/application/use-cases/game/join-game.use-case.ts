import { type EventEmitter2 } from "@nestjs/event-emitter";
import {
    InvalidGameCode,
    PlayerNotFoundError,
} from "../../../domain/errors/game.errors";
import { type GameSharedService } from "../../game-shared.service";
import { type GameUpdatedPayload, GAME_UPDATED } from "../../game.events";
import { type IGameRepository } from "../../game.repository.interface";

export class JoinGameUseCase {
    constructor(
        private readonly gameSharedService: GameSharedService,
        private readonly repository: IGameRepository,
        private readonly eventEmitter: EventEmitter2,
    ) { }
    async execute(roomId: string, code: string, actorId: string) {
        const room = await this.gameSharedService.loadGame(roomId);
        const actor = await this.repository.findPlayerById(actorId, roomId);
        if (!actor) {
            throw new PlayerNotFoundError(actorId);
        }
        if (room.settings.isPrivate && room.settings.code) {
            if (!(await this.gameSharedService.validateCode(roomId, code)))
                throw new InvalidGameCode();
        }
        const existingPlayer = room.players.find((p) => p.id === actor.id);

        if (existingPlayer) {
            room.setPlayerOnline(existingPlayer.id);
        } else {
            room.joinRoom(actor.id, actor.name);
        }

        await this.repository.saveGame(room);
        await this.repository.setUserRoom(actor.id, room.id);
        const roomPrimitives = room.toPrimitives();
        const eventPayload: GameUpdatedPayload = {
            room: roomPrimitives,
        };
        this.eventEmitter.emit(GAME_UPDATED, eventPayload);
        return roomPrimitives;
    }
}
