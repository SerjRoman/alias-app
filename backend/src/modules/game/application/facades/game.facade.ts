import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { type UserDto } from "../../../auth/dto/user.dto";
import {
	type ChangeWordScoreDto,
	type CreateGameDto,
	type DeleteGameDto,
	type GetRoomCodeDto,
	type JoinGameDto,
	type NextRoundDto,
	type NextWordDto,
	type UpdateGameSettingsDto,
} from "../../dto/body";
import { DictionaryService } from "../dictionary.service";
import { GameSharedService } from "../game-shared.service";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../game.repository.interface";
import { RoundScheduler } from "../round-scheduler.service";
import { ChangeWordScoreUseCase } from "../use-cases/game/change-word-score.use-case";
import { CreateGameUseCase } from "../use-cases/game/create-game.use-case";
import { DeleteFinishedGameUseCase } from "../use-cases/game/delete-finished-game.use-case";
import { DeleteGameUseCase } from "../use-cases/game/delete-game.use-case";
import { FindAllGamesUseCase } from "../use-cases/game/find-all-games.use-case";
import { FindOneGameUseCase } from "../use-cases/game/find-one.use-case";
import { FinishGameUseCase } from "../use-cases/game/finish-game.use-case";
import { GetGameCodeUseCase } from "../use-cases/game/get-game-code.use-case";
import { GetPrivatePlayerStateUseCase } from "../use-cases/game/get-private-player-state.use-case";
import { JoinGameUseCase } from "../use-cases/game/join-game.use-case";
import { LeaveGameUseCase } from "../use-cases/game/leave-game.use.case";
import { NextRoundUseCase } from "../use-cases/game/next-round.use-case";
import { NextWordUseCase } from "../use-cases/game/next-word.use-case";
import { StartGameUseCase } from "../use-cases/game/start-game.use-case";
import { ToggleReadyUseCase } from "../use-cases/game/toggle-game-ready.use-case";
import { UpdateGameSettingsUseCase } from "../use-cases/game/update-game-settings.use-case";
import { ValidateCodeUseCase } from "../use-cases/game/validate-code.use-case";

@Injectable()
export class GameFacade {
	private readonly createGameUseCase: CreateGameUseCase;
	private readonly findAllGamesUseCase: FindAllGamesUseCase;
	private readonly findOneGameUseCase: FindOneGameUseCase;
	private readonly deleteGameUseCase: DeleteGameUseCase;
	private readonly deleteFinishedGameUseCase: DeleteFinishedGameUseCase;
	private readonly finishGameUseCase: FinishGameUseCase;
	private readonly joinGameUseCase: JoinGameUseCase;
	private readonly leaveGameUseCase: LeaveGameUseCase;
	private readonly nextRoundUseCase: NextRoundUseCase;
	private readonly nextWordUseCase: NextWordUseCase;
	private readonly changeWordScoreUseCase: ChangeWordScoreUseCase;
	private readonly startGameUseCase: StartGameUseCase;
	private readonly toggleReadyUseCase: ToggleReadyUseCase;
	private readonly updateGameSettingsUseCase: UpdateGameSettingsUseCase;
	private readonly getGameCodeUseCase: GetGameCodeUseCase;
	private readonly validateCodeUseCase: ValidateCodeUseCase;
	private readonly getPrivatePlayerStateUseCase: GetPrivatePlayerStateUseCase;

	constructor(
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
		private readonly dictionaryService: DictionaryService,
		private readonly roundScheduler: RoundScheduler,
	) {
		this.createGameUseCase = new CreateGameUseCase(
			this.repository,
			this.gameSharedService,
		);
		this.findAllGamesUseCase = new FindAllGamesUseCase(this.repository);
		this.findOneGameUseCase = new FindOneGameUseCase(
			this.gameSharedService,
		);
		this.deleteGameUseCase = new DeleteGameUseCase(
			this.repository,
			this.gameSharedService,
		);
		this.deleteFinishedGameUseCase = new DeleteFinishedGameUseCase(
			this.gameSharedService,
			this.repository,
			this.eventEmitter,
		);
		this.finishGameUseCase = new FinishGameUseCase(
			this.gameSharedService,
			this.repository,
		);
		this.joinGameUseCase = new JoinGameUseCase(
			this.gameSharedService,
			this.repository,
			this.eventEmitter,
		);
		this.leaveGameUseCase = new LeaveGameUseCase(
			this.gameSharedService,
			this.repository,
			this.eventEmitter,
		);
		this.nextRoundUseCase = new NextRoundUseCase(
			this.gameSharedService,
			this.repository,
			this.eventEmitter,
			this.dictionaryService,
			this.roundScheduler,
		);
		this.nextWordUseCase = new NextWordUseCase(
			this.gameSharedService,
			this.repository,
			this.eventEmitter,
			this.dictionaryService,
		);
		this.changeWordScoreUseCase = new ChangeWordScoreUseCase(
			this.gameSharedService,
			this.repository,
			this.eventEmitter,
		);
		this.startGameUseCase = new StartGameUseCase(
			this.gameSharedService,
			this.repository,
			this.eventEmitter,
			this.dictionaryService,
		);
		this.toggleReadyUseCase = new ToggleReadyUseCase(
			this.gameSharedService,
			this.repository,
			this.eventEmitter,
		);
		this.updateGameSettingsUseCase = new UpdateGameSettingsUseCase(
			this.repository,
			this.gameSharedService,
		);
		this.getGameCodeUseCase = new GetGameCodeUseCase(
			this.gameSharedService,
		);
		this.validateCodeUseCase = new ValidateCodeUseCase(
			this.gameSharedService,
		);
		this.getPrivatePlayerStateUseCase = new GetPrivatePlayerStateUseCase(
			this.gameSharedService,
		);
	}

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
		return this.deleteGameUseCase.execute(gameId, actor.id);
	}

	async deleteGame(dto: DeleteGameDto, actor: UserDto) {
		return this.deleteFinishedGameUseCase.execute(dto, actor.id);
	}

	async finishGame(roomId: string, actorId?: string) {
		return this.finishGameUseCase.execute(roomId, actorId);
	}

	async joinGame(dto: JoinGameDto, actor: UserDto) {
		return this.joinGameUseCase.execute(dto, actor);
	}

	async leaveGame(roomId: string, playerId: string) {
		return this.leaveGameUseCase.execute(roomId, playerId);
	}

	async startGame(roomId: string, actor: UserDto) {
		return this.startGameUseCase.execute(roomId, actor.id);
	}

	async toggleReady(roomId: string, actor: UserDto) {
		return this.toggleReadyUseCase.execute(roomId, actor.id);
	}

	async nextRound(dto: NextRoundDto, actor: UserDto) {
		return this.nextRoundUseCase.execute(dto, actor);
	}

	async nextWord(dto: NextWordDto, actor: UserDto) {
		return this.nextWordUseCase.execute(dto, actor);
	}

	async changeWordScore(dto: ChangeWordScoreDto, actor: UserDto) {
		return this.changeWordScoreUseCase.execute(dto, actor);
	}

	async updateGameSettings(dto: UpdateGameSettingsDto, actor: UserDto) {
		return this.updateGameSettingsUseCase.execute(dto, actor.id);
	}

	async getRoomCode(dto: GetRoomCodeDto, actor: UserDto) {
		return this.getGameCodeUseCase.execute(dto, actor.id);
	}

	async validateCode(roomId: string, code?: string) {
		return this.validateCodeUseCase.execute(roomId, code);
	}

	async getPrivatePlayerState(roomId: string, userId: string) {
		return this.getPrivatePlayerStateUseCase.execute(roomId, userId);
	}
}
