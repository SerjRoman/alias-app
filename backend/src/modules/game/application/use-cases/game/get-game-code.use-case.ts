import { UserDto } from "@common/dto/user.dto";
import { GetRoomCodeDto } from "../../dto/body";
import { type GameSharedService } from "../../game-shared.service";

export class GetGameCodeUseCase {
	constructor(private readonly gameSharedService: GameSharedService) {}
	async execute(dto: GetRoomCodeDto, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.assertRoomOwner(actor.id);
		return { code: room.settings.code };
	}
}
