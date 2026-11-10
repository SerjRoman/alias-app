import { UserDto } from "@common/dto/user.dto";
import { ShufflePlayersDto } from "../../dto/body";
import { Injectable } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class ShufflePlayersUseCase extends RoomUseCase<ShufflePlayersDto> {
	protected override notify = ["game"] as const;

	protected override handle(
		game: GameEngine,
		_dto: ShufflePlayersDto,
		actor: UserDto,
	) {
		game.dispatch({
			type: "SHUFFLE_PLAYERS",
			actorId: actor.id,
		});
	}
}
