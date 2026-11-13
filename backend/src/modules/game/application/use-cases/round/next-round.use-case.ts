import { UserDto } from "@common/dto/user.dto";
import { NextRoundDto } from "../../dto/body";
import { Injectable } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class NextRoundUseCase extends RoomUseCase<NextRoundDto, void> {
	protected override readonly notify = ["game", "round"] as const;

	protected override handle(
		engine: GameEngine,
		dto: NextRoundDto,
		actor: UserDto,
	): void {
		engine.dispatch({
			type: "NEXT_ROUND",
			actorId: actor.id,
		});
	}
}
