import { Injectable } from "@nestjs/common";

import { ChangeWordOutcomeUseCase } from "../use-cases/round/change-word-outcome.use-case";
import { CreateGameUseCase } from "../use-cases/game/create-game.use-case";
import { DeleteFinishedGameUseCase } from "../use-cases/game/delete-finished-game.use-case";
import { DeleteGameUseCase } from "../use-cases/game/delete-game.use-case";
import { FindAllGamesUseCase } from "../use-cases/game/find-all-games.use-case";
import { FindOneGameUseCase } from "../use-cases/game/find-one.use-case";
import { EndGameUseCase } from "../use-cases/game/end-game.use-case";
import { GetGameCodeUseCase } from "../use-cases/game/get-game-code.use-case";
import { GetPrivatePlayerStateUseCase } from "../use-cases/player/get-private-player-state.use-case";
import { JoinGameUseCase } from "../use-cases/game/join-game.use-case";
import { LeaveGameUseCase } from "../use-cases/game/leave-game.use-case";
import { NextRoundUseCase } from "../use-cases/round/next-round.use-case";
import { NextWordUseCase } from "../use-cases/round/next-word.use-case";
import { StartGameUseCase } from "../use-cases/game/start-game.use-case";
import { ToggleReadyUseCase } from "../use-cases/game/toggle-game-ready.use-case";
import { UpdateGameSettingsUseCase } from "../use-cases/game/update-game-settings.use-case";
import { ValidateCodeUseCase } from "../use-cases/game/validate-code.use-case";
import { UserDto } from "@common/dto/user.dto";
import {
	CreateGameDto,
	DeleteGameDto,
	JoinGameDto,
	NextRoundDto,
	NextWordDto,
	ChangeWordOutcomeDto,
	UpdateGameSettingsDto,
	GetRoomCodeDto,
	EndGameDto,
	ShufflePlayersDto,
	BuyItemDto,
	UseItemDto,
	PauseGameDto,
	ResumeGameDto,
	GetShopCatalogDto,
} from "../dto/body";
import { ShopCatalogResponseDto, ShopCatalogItemDto } from "../dto/response";
import { ShufflePlayersUseCase } from "../use-cases/game/shuffle-players.use-case";
import { BuyItemUseCase } from "../use-cases/shop/buy-item.use-case";
import { UseItemUseCase } from "../use-cases/shop/use-item.use-case";
import { GetShopCatalogUseCase } from "../use-cases/shop/get-shop-catalog.use-case";
import { PauseRoundUseCase } from "../use-cases/round/pause-round.use-case";
import { ResumeRoundUseCase } from "../use-cases/round/resume-round.use-case";
import { SHOP_CATALOG, MAX_INVENTORY_SIZE } from "../../domain/shop/shop.types";
import { plainToInstance } from "class-transformer";

@Injectable()
export class GameFacade {
	constructor(
		private readonly createGameUseCase: CreateGameUseCase,
		private readonly findAllGamesUseCase: FindAllGamesUseCase,
		private readonly findOneGameUseCase: FindOneGameUseCase,
		private readonly deleteGameUseCase: DeleteGameUseCase,
		private readonly deleteFinishedGameUseCase: DeleteFinishedGameUseCase,
		private readonly endGameUseCase: EndGameUseCase,
		private readonly joinGameUseCase: JoinGameUseCase,
		private readonly leaveGameUseCase: LeaveGameUseCase,
		private readonly nextRoundUseCase: NextRoundUseCase,
		private readonly nextWordUseCase: NextWordUseCase,
		private readonly changeWordOutcomeUseCase: ChangeWordOutcomeUseCase,
		private readonly startGameUseCase: StartGameUseCase,
		private readonly toggleReadyUseCase: ToggleReadyUseCase,
		private readonly updateGameSettingsUseCase: UpdateGameSettingsUseCase,
		private readonly getGameCodeUseCase: GetGameCodeUseCase,
		private readonly validateCodeUseCase: ValidateCodeUseCase,
		private readonly getPrivatePlayerStateUseCase: GetPrivatePlayerStateUseCase,
		private readonly shufflePlayersUseCase: ShufflePlayersUseCase,
		private readonly buyItemUseCase: BuyItemUseCase,
		private readonly useItemUseCase: UseItemUseCase,
		private readonly getShopCatalogUseCase: GetShopCatalogUseCase,
		private readonly pauseRoundUseCase: PauseRoundUseCase,
		private readonly resumeRoundUseCase: ResumeRoundUseCase,
	) {}

	async create(dto: CreateGameDto, actor: UserDto) {
		return this.createGameUseCase.execute(dto, actor);
	}

	async findAll() {
		return this.findAllGamesUseCase.execute();
	}

	async findOne(gameId: string) {
		return (await this.findOneGameUseCase.execute(gameId)).toPrimitives();
	}

	async delete(gameId: string, actor: UserDto) {
		return this.deleteGameUseCase.execute(gameId, actor);
	}

	async deleteGame(dto: DeleteGameDto, actor: UserDto) {
		return this.deleteFinishedGameUseCase.execute(dto, actor);
	}

	async endGame(dto: EndGameDto, actor: UserDto) {
		return this.endGameUseCase.execute(dto, actor);
	}

	async joinGame(dto: JoinGameDto, actor: UserDto) {
		return this.joinGameUseCase.execute(dto, actor);
	}

	async leaveGame(roomId: string, actor: UserDto) {
		return this.leaveGameUseCase.execute(roomId, actor);
	}

	async startGame(roomId: string, actor: UserDto) {
		return this.startGameUseCase.execute(roomId, actor);
	}

	async toggleReady(roomId: string, actor: UserDto) {
		return this.toggleReadyUseCase.execute(roomId, actor);
	}

	async nextRound(dto: NextRoundDto, actor: UserDto) {
		return this.nextRoundUseCase.execute(dto, actor);
	}

	async nextWord(dto: NextWordDto, actor: UserDto) {
		return this.nextWordUseCase.execute(dto, actor);
	}

	async changeWordOutcome(dto: ChangeWordOutcomeDto, actor: UserDto) {
		return this.changeWordOutcomeUseCase.execute(dto, actor);
	}

	async updateGameSettings(dto: UpdateGameSettingsDto, actor: UserDto) {
		return this.updateGameSettingsUseCase.execute(dto, actor);
	}

	async getRoomCode(dto: GetRoomCodeDto, actor: UserDto) {
		return this.getGameCodeUseCase.execute(dto, actor);
	}

	async validateCode(roomId: string, code?: string) {
		return this.validateCodeUseCase.execute(roomId, code);
	}

	async getPrivatePlayerState(roomId: string, userId: string) {
		return this.getPrivatePlayerStateUseCase.execute(roomId, userId);
	}

	async shufflePlayers(dto: ShufflePlayersDto, actor: UserDto) {
		return this.shufflePlayersUseCase.execute(dto, actor);
	}

	async buyItem(dto: BuyItemDto, actor: UserDto) {
		return this.buyItemUseCase.execute(dto, actor);
	}

	async useItem(dto: UseItemDto, actor: UserDto) {
		return this.useItemUseCase.execute(dto, actor);
	}

	async pauseGame(dto: PauseGameDto, actor: UserDto) {
		return this.pauseRoundUseCase.execute(dto, actor);
	}

	async resumeGame(dto: ResumeGameDto, actor: UserDto) {
		return this.resumeRoundUseCase.execute(dto, actor);
	}

	async getShopCatalog(
		dto: Partial<GetShopCatalogDto>,
		actor?: UserDto,
	): Promise<ShopCatalogResponseDto> {
		if (dto.roomId && actor) {
			return this.getShopCatalogUseCase.execute(
				{ roomId: dto.roomId },
				actor,
			);
		}

		const items: ShopCatalogItemDto[] = SHOP_CATALOG.map((item) => ({
			id: item.id,
			name: item.name,
			description: item.description,
			price: item.price,
			target: item.target,
			durationType: item.durationType,
			charges: item.charges,
			durationSeconds: item.durationSeconds,
			requiresSetting: item.requiresSetting,
			isAvailable: true,
		}));

		return plainToInstance(
			ShopCatalogResponseDto,
			{
				items,
				maxInventorySize: MAX_INVENTORY_SIZE,
				isShopEnabled: true,
			},
			{ excludeExtraneousValues: true },
		);
	}
}
