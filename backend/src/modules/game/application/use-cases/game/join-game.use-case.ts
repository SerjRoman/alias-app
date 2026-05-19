import { EventEmitter2 } from "@nestjs/event-emitter";
import { InvalidGameCode } from "../../../domain/errors/game.errors";
import { GameSharedService } from "../../game-shared.service";
import { type GameUpdatedPayload, GAME_UPDATED } from "../../game.events";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { UserDto } from "@common/dto/user.dto";
import { JoinGameDto } from "../../dto/body";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class JoinGameUseCase {
	constructor(
		private readonly gameSharedService: GameSharedService,
		@Inject(GAME_REPOSITORY)
		private readonly repository: IGameRepository,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(dto: JoinGameDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		if (room.settings.isPrivate && room.settings.code) {
			if (!dto.code) {
				throw new InvalidGameCode();
			}
			if (
				!(await this.gameSharedService.validateCode(
					dto.roomId,
					dto.code,
				))
			)
				throw new InvalidGameCode();
		}
		const existingPlayer = room.players.find((p) => p.id === actor.id);

		if (existingPlayer) {
			room.setPlayerOnline(existingPlayer.id);
		} else {
			room.joinRoom(actor.id, actor.name, actor.role);
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
