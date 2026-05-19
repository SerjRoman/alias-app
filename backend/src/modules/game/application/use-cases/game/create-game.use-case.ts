import { UserDto } from "@common/dto/user.dto";
import {
	type GameSettings,
	GameEntity,
} from "../../../domain/entities/game.entity";
import { CreateGameDto } from "../../dto/body";
import { GameSharedService } from "../../game-shared.service";
import {
	type IGameRepository,
	GAME_REPOSITORY,
} from "../../game.repository.interface";
import { Injectable, Inject } from "@nestjs/common";

@Injectable()
export class CreateGameUseCase {
	constructor(
		@Inject(GAME_REPOSITORY)
		private readonly repository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
	) {}
	async execute(createGameDto: CreateGameDto, user: UserDto) {
		const code = createGameDto.isPrivate
			? this.gameSharedService.generateRoomCode(6)
			: null;
		const settings: GameSettings = {
			name: createGameDto.name,
			roundTimeSeconds: createGameDto.timeLimit,
			pointsToWin: createGameDto.pointsToWin,
			code: code,
			isPrivate: createGameDto.isPrivate || false,
			level: createGameDto.level,
			isOnlyOwnerCanNextRound: true,
			isOnlyOwnerCanChangeScore: true,
		};
		const newRoom = GameEntity.create(user.id, settings);

		await this.repository.saveGame(newRoom);
		return { room: newRoom.toPrimitives(), code };
	}
}
