import { Injectable } from "@nestjs/common";
import { type UserDto } from "../../../user/application/dto/user.dto";
import { type KickPlayerDto } from "../../dto/body";
import { GetCurrentGameUseCase } from "../use-cases/player/get-current-game.use-case";
import { GetUserRoomUseCase } from "../use-cases/player/get-user-room.use-case";
import { KickPlayerUseCase } from "../use-cases/player/kick-player.use-case";
import { SetPlayerOfflineUseCase } from "../use-cases/player/set-player-offline.use-case";

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
		return this.kickPlayerUseCase.execute(dto, dto.roomId, actor.id);
	}

	async setPlayerOffline(roomId: string, playerId: string) {
		return this.setPlayerOfflineUseCase.execute(roomId, playerId);
	}
}
