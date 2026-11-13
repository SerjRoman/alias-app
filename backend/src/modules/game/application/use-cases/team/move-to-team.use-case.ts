import { MoveToTeamDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { Injectable } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class MoveToTeamUseCase extends RoomUseCase<MoveToTeamDto> {
	protected override notify = ["teams", "players", "game"] as const;

	protected override handle(
		room: GameEngine,
		dto: MoveToTeamDto,
		actor: UserDto,
	) {
		const targetPlayerId = dto.playerId ?? actor.id;

		room.dispatch({
			type: "MOVE_TO_TEAM",
			actorId: actor.id,
			payload: {
				playerId: targetPlayerId,
				teamId: dto.teamId,
			},
		});
	}
}
