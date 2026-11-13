import { v4 as uuidv4 } from "uuid";
import { UserDto } from "@common/dto/user.dto";
import { GameStatus, type GameSettings } from "../../../domain";
import { GameEngine } from "../../../domain/engine/game-engine";
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
			roundTimeSeconds: createGameDto.roundTimeSeconds,
			pointsToWin: createGameDto.pointsToWin,
			code: code,
			isPrivate: createGameDto.isPrivate || false,
			wordPackSelections: createGameDto.wordPackSelections || [],
			isHatMode: createGameDto.isHatMode || false,
			wordsPerPlayer: createGameDto.isHatMode
				? createGameDto.wordsPerPlayer || 0
				: 0,
			isOnlyOwnerCanNextRound:
				createGameDto.isOnlyOwnerCanNextRound ?? true,
			isOnlyOwnerCanChangeScore:
				createGameDto.isOnlyOwnerCanChangeScore ?? true,
			isVoiceChatEnabled: true,
			isShopEnabled: createGameDto.isShopEnabled ?? false,
			isBettingEnabled: createGameDto.isBettingEnabled ?? false,
		};
		const newRoom = GameEngine.create(uuidv4(), user.id, {
			status: GameStatus.LOBBY,
			settings,
			pointsToWin: settings.pointsToWin,
			roundTimeSeconds: settings.roundTimeSeconds,
			winnerTeamId: null,
			lastTeamPlayedIndex: -1,
			createdAt: Date.now(),
			nextRoundNumber: 1,
			spectators: [],
		});

		await this.repository.saveGame(newRoom);
		return { room: newRoom.toPrimitives(), code };
	}
}
