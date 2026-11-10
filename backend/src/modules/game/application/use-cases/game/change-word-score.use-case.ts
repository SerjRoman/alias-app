import { RoundNotActiveError } from "../../../domain/errors/round.errors";
import { ChangeWordScoreDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { Injectable } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class ChangeWordScoreUseCase extends RoomUseCase<
	ChangeWordScoreDto,
	void
> {
	protected override readonly notify = ["round"] as const;

	protected override handle(
		engine: GameEngine,
		dto: ChangeWordScoreDto,
		actor: UserDto,
	): void {
		const currentRound = engine.getState().currentRound;
		if (!currentRound) {
			throw new RoundNotActiveError();
		}

		engine.dispatch({
			type: "CHANGE_WORD_SCORE",
			actorId: actor.id,
			payload: { wordId: dto.wordId, delta: dto.delta },
		});
	}
}
