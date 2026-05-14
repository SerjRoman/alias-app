import { Injectable } from "@nestjs/common";
import { GetCurrentGameUseCase } from "../use-cases/player/get-current-game.use-case";
import { GetUserRoomUseCase } from "../use-cases/player/get-user-room.use-case";
import { KickPlayerUseCase } from "../use-cases/player/kick-player.use-case";
import { SetPlayerOfflineUseCase } from "../use-cases/player/set-player-offline.use-case";
import { UserDto } from "@common/dto/user.dto";
import { KickPlayerDto } from "../dto/body";

@Injectable()
export class PlayerFacade {
	constructor(
		private readonly getCurrentGameUseCase: GetCurrentGameUseCase,
		private readonly getUserRoomUseCase: GetUserRoomUseCase,
		private readonly kickPlayerUseCase: KickPlayerUseCase,
		private readonly setPlayerOfflineUseCase: SetPlayerOfflineUseCase,
	) {}

	async getUserRoom(userId: string) {
		return this.getUserRoomUseCase.execute(userId);
	}

	async getGameIdByUserId(userId: string) {
		return this.getCurrentGameUseCase.execute(userId);
	}

	async kickPlayer(dto: KickPlayerDto, actor: UserDto) {
		return this.kickPlayerUseCase.execute(dto, dto.roomId, actor);
	}

	async setPlayerOffline(roomId: string, actor: UserDto) {
		return this.setPlayerOfflineUseCase.execute(roomId, actor);
	}
}
