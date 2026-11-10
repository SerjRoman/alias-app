import { UserDto } from "@common/dto/user.dto";
import { Injectable } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class ToggleRoundReadyUseCase extends RoomUseCase<string> {
	protected override notify = ["players"] as const;

	protected override handle(
		room: GameEngine,
		_roomId: string,
		actor: UserDto,
	) {
		room.dispatch({
			type: "TOGGLE_ROUND_READY",
			actorId: actor.id,
			payload: { playerId: actor.id },
		});
	}
}
