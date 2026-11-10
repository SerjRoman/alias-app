import { CreateTeamDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { Injectable } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class CreateTeamUseCase extends RoomUseCase<CreateTeamDto> {
	protected override notify = ["teams", "game"] as const;

	protected override handle(
		engine: GameEngine,
		dto: CreateTeamDto,
		actor: UserDto,
	) {
		engine.dispatch({
			type: "ADD_TEAM",
			actorId: actor.id,
			payload: { name: dto.teamName },
		});
	}
}
