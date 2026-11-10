import { DeleteGameDto } from "../../dto/body";
import { UserDto } from "@common/dto/user.dto";
import { Injectable } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class DeleteFinishedGameUseCase extends RoomUseCase<
	DeleteGameDto,
	void
> {
	protected override readonly notify = ["game"] as const;
	protected override skipSave = true;

	protected override async handle(
		room: GameEngine,
		dto: DeleteGameDto,
		actor: UserDto,
	): Promise<void> {
		room.dispatch({
			type: "DELETE_GAME",
			actorId: actor.id,
			payload: { requireFinished: true },
		});

		await this.gameRepository.deleteGame(dto.roomId);
	}

	protected override async afterCommit(room: GameEngine): Promise<void> {
		const events = room.pullDomainEvents();
		for (const event of events) {
			await this.eventEmitter.emitAsync(event.name, event);
		}
	}
}
