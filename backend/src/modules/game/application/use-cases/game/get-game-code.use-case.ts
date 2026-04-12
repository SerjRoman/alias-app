import { type GetRoomCodeDto } from "../../../dto/body";
import { type GameSharedService } from "../../game-shared.service";

export class GetGameCodeUseCase {
	constructor(private readonly gameSharedService: GameSharedService) {}
	async execute(dto: GetRoomCodeDto, actorId: string) {
		const room = await this.gameSharedService.loadGame(dto.roomId);
		room.assertRoomOwner(actorId);
		return { code: room.settings.code };
	}
}
