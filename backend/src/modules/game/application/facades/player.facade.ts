import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { type UserDto } from "../../../auth/dto/user.dto";
import { type KickPlayerDto } from "../../dto/body";
import { GameSharedService } from "../game-shared.service";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../game.repository.interface";
import { GetCurrentGameUseCase } from "../use-cases/player/get-current-game.use-case";
import { GetUserRoomUseCase } from "../use-cases/player/get-user-room.use-case";
import { KickPlayerUseCase } from "../use-cases/player/kick-player.use-case";
import { SetPlayerOfflineUseCase } from "../use-cases/player/set-player-offline.use-case";

@Injectable()
export class PlayerFacade {
	private readonly getCurrentGameUseCase: GetCurrentGameUseCase;
	private readonly getUserRoomUseCase: GetUserRoomUseCase;
	private readonly kickPlayerUseCase: KickPlayerUseCase;
	private readonly setPlayerOfflineUseCase: SetPlayerOfflineUseCase;

	constructor(
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
	) {
		this.getCurrentGameUseCase = new GetCurrentGameUseCase(this.repository);
		this.getUserRoomUseCase = new GetUserRoomUseCase(this.repository);
		this.kickPlayerUseCase = new KickPlayerUseCase(
			this.repository,
			this.gameSharedService,
			this.eventEmitter,
		);
		this.setPlayerOfflineUseCase = new SetPlayerOfflineUseCase(
			this.gameSharedService,
			this.repository,
			this.eventEmitter,
		);
	}

	async getUserRoom(userId: string) {
		return this.getUserRoomUseCase.execute(userId);
	}

	async getGameIdByUserId(userId: string) {
		return this.getCurrentGameUseCase.execute(userId);
	}

	async kickPlayer(dto: KickPlayerDto, actor: UserDto) {
		return this.kickPlayerUseCase.execute(dto, dto.roomId, actor.id);
	}

	async setPlayerOffline(roomId: string, playerId: string) {
		return this.setPlayerOfflineUseCase.execute(roomId, playerId);
	}
}
