import { Injectable } from "@nestjs/common";
import { FinishRoundDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";
import type { GameState } from "../../../domain/state/game.state";

@Injectable()
export class FinishRoundUseCase extends RoomUseCase<FinishRoundDto, GameState> {
	protected override readonly notify = ["game"] as const;

	protected override handle(
		room: GameEngine,
		dto: FinishRoundDto,
		actor: UserDto,
	): void {
		room.dispatch({
			type: "FINISH_ROUND",
			actorId: actor.id,
		});
	}
}
