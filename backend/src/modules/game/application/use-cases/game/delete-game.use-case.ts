import { UserDto } from "@common/dto/user.dto";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { Injectable, Inject } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Injectable()
export class DeleteGameUseCase {
	constructor(
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
	) {}
	async execute(gameId: string, actor: UserDto) {
		const room = await this.gameSharedService.loadGame(gameId);
		room.assertRoomOwner(actor.id);

		room.delete();

		await this.gameRepository.deleteGame(gameId);

		const events = room.pullDomainEvents();
		for (const event of events) {
			await this.eventEmitter.emitAsync(event.name, event);
		}
	}
}
