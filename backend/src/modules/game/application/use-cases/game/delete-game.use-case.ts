import { UserDto } from "@common/dto/user.dto";
import { Injectable } from "@nestjs/common";
import { RoomUseCase } from "../room.use-case";
import type { GameEngine } from "../../../domain/engine/game-engine";

@Injectable()
export class DeleteGameUseCase extends RoomUseCase<string, void> {
	protected override readonly notify = [] as const;
	protected override skipSave = true;

	protected override async handle(
		room: GameEngine,
		gameId: string,
		actor: UserDto,
	): Promise<void> {
		room.dispatch({
			type: "DELETE_GAME",
			actorId: actor.id,
		});

		await this.gameRepository.deleteGame(gameId);
	}

	protected override async afterCommit(room: GameEngine): Promise<void> {
		const events = room.pullDomainEvents();
		for (const event of events) {
			await this.eventEmitter.emitAsync(event.name, event);
		}
	}
}
