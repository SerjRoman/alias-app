import { UserDto } from "@common/dto/user.dto";
import { Injectable } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class ToggleReadyUseCase extends RoomUseCase<string> {
	protected override notify = ["players"] as const;

	protected override handle(
		engine: GameEngine,
		roomId: string,
		actor: UserDto,
	) {
		engine.dispatch({
			type: "TOGGLE_READY",
			actorId: actor.id,
			payload: { playerId: actor.id },
		});
	}
}
