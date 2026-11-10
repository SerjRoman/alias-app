import { UserDto } from "@common/dto/user.dto";
import { GetRoomCodeDto } from "../../dto/body";
import { GameSharedService } from "../../game-shared.service";
import { PlayerNotRoomOwnerError } from "../../../domain/errors/game.errors";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GetGameCodeUseCase {
	constructor(private readonly gameSharedService: GameSharedService) {}
	async execute(dto: GetRoomCodeDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		const state = room.getState();
		if (state.ownerId !== actor.id) {
			throw new PlayerNotRoomOwnerError();
		}
		return { code: state.settings?.code ?? null };
	}
}
