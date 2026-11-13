import { RoundNotActiveError } from "../../../domain/errors/round.errors";
import { ChangeWordOutcomeDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { Injectable } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class ChangeWordOutcomeUseCase extends RoomUseCase<
	ChangeWordOutcomeDto,
	void
> {
	protected override readonly notify = ["round", "teams", "game"] as const;

	protected override handle(
		engine: GameEngine,
		dto: ChangeWordOutcomeDto,
		actor: UserDto,
	): void {
		const currentRound = engine.getState().currentRound;
		if (!currentRound) {
			throw new RoundNotActiveError();
		}

		engine.dispatch({
			type: "CHANGE_WORD_OUTCOME",
			actorId: actor.id,
			payload: { wordId: dto.wordId, outcome: dto.outcome },
		});
	}
}
