import { DeleteTeamDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { Injectable } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class DeleteTeamUseCase extends RoomUseCase<DeleteTeamDto> {
	protected override notify = ["teams", "players", "game"] as const;

	protected override handle(
		room: GameEngine,
		dto: DeleteTeamDto,
		actor: UserDto,
	) {
		room.dispatch({
			type: "DELETE_TEAM",
			actorId: actor.id,
			payload: { teamId: dto.teamId },
		});
	}
}
