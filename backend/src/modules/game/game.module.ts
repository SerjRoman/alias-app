import { Module } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GameFacade } from "./application/facades/game.facade";
import { PlayerFacade } from "./application/facades/player.facade";
import { RoundFacade } from "./application/facades/round.facade";
import { TeamFacade } from "./application/facades/team.facade";
import { GameSharedService } from "./application/game-shared.service";
import { GameController } from "./presentation/game.controller";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "./application/game.repository.interface";
import { RoundScheduler } from "./application/round-scheduler.service";
import { RedisGameRepository } from "./infrastructure/redis-game.repository";
import { GameGateway } from "./presentation/game.gateway";
import { DictionaryService } from "./application/dictionary.service";
import { ChangeWordScoreUseCase } from "./application/use-cases/game/change-word-score.use-case";
import { CreateGameUseCase } from "./application/use-cases/game/create-game.use-case";
import { DeleteFinishedGameUseCase } from "./application/use-cases/game/delete-finished-game.use-case";
import { DeleteGameUseCase } from "./application/use-cases/game/delete-game.use-case";
import { FindAllGamesUseCase } from "./application/use-cases/game/find-all-games.use-case";
import { FindOneGameUseCase } from "./application/use-cases/game/find-one.use-case";
import { FinishGameUseCase } from "./application/use-cases/game/finish-game.use-case";
import { GetGameCodeUseCase } from "./application/use-cases/game/get-game-code.use-case";
import { GetPrivatePlayerStateUseCase } from "./application/use-cases/game/get-private-player-state.use-case";
import { JoinGameUseCase } from "./application/use-cases/game/join-game.use-case";
import { LeaveGameUseCase } from "./application/use-cases/game/leave-game.use.case";
import { NextRoundUseCase } from "./application/use-cases/game/next-round.use-case";
import { NextWordUseCase } from "./application/use-cases/game/next-word.use-case";
import { StartGameUseCase } from "./application/use-cases/game/start-game.use-case";
import { ToggleReadyUseCase } from "./application/use-cases/game/toggle-game-ready.use-case";
import { UpdateGameSettingsUseCase } from "./application/use-cases/game/update-game-settings.use-case";
import { ValidateCodeUseCase } from "./application/use-cases/game/validate-code.use-case";
import { GetCurrentGameUseCase } from "./application/use-cases/player/get-current-game.use-case";
import { GetUserRoomUseCase } from "./application/use-cases/player/get-user-room.use-case";
import { KickPlayerUseCase } from "./application/use-cases/player/kick-player.use-case";
import { SetPlayerOfflineUseCase } from "./application/use-cases/player/set-player-offline.use-case";
import { StartRoundUseCase } from "./application/use-cases/round/start-round.use-case";
import { ToggleRoundReadyUseCase } from "./application/use-cases/round/toggle-round-ready.use-case";
import { CreateTeamUseCase } from "./application/use-cases/team/create-team.use-case";
import { DeleteTeamUseCase } from "./application/use-cases/team/delete-team.use-case";
import { MoveToTeamUseCase } from "./application/use-cases/team/move-to-team.use-case";

const useCaseProviders = [
	{
		provide: CreateGameUseCase,
		useFactory: (
			repository: IGameRepository,
			gameSharedService: GameSharedService,
		) => new CreateGameUseCase(repository, gameSharedService),
		inject: [GAME_REPOSITORY, GameSharedService],
	},
	{
		provide: FindAllGamesUseCase,
		useFactory: (repository: IGameRepository) =>
			new FindAllGamesUseCase(repository),
		inject: [GAME_REPOSITORY],
	},
	{
		provide: FindOneGameUseCase,
		useFactory: (gameSharedService: GameSharedService) =>
			new FindOneGameUseCase(gameSharedService),
		inject: [GameSharedService],
	},
	{
		provide: DeleteGameUseCase,
		useFactory: (
			repository: IGameRepository,
			gameSharedService: GameSharedService,
		) => new DeleteGameUseCase(repository, gameSharedService),
		inject: [GAME_REPOSITORY, GameSharedService],
	},
	{
		provide: DeleteFinishedGameUseCase,
		useFactory: (
			gameSharedService: GameSharedService,
			repository: IGameRepository,
			eventEmitter: EventEmitter2,
		) =>
			new DeleteFinishedGameUseCase(
				gameSharedService,
				repository,
				eventEmitter,
			),
		inject: [GameSharedService, GAME_REPOSITORY, EventEmitter2],
	},
	{
		provide: FinishGameUseCase,
		useFactory: (
			gameSharedService: GameSharedService,
			repository: IGameRepository,
		) => new FinishGameUseCase(gameSharedService, repository),
		inject: [GameSharedService, GAME_REPOSITORY],
	},
	{
		provide: JoinGameUseCase,
		useFactory: (
			gameSharedService: GameSharedService,
			repository: IGameRepository,
			eventEmitter: EventEmitter2,
		) => new JoinGameUseCase(gameSharedService, repository, eventEmitter),
		inject: [GameSharedService, GAME_REPOSITORY, EventEmitter2],
	},
	{
		provide: LeaveGameUseCase,
		useFactory: (
			gameSharedService: GameSharedService,
			repository: IGameRepository,
			eventEmitter: EventEmitter2,
		) => new LeaveGameUseCase(gameSharedService, repository, eventEmitter),
		inject: [GameSharedService, GAME_REPOSITORY, EventEmitter2],
	},
	{
		provide: NextRoundUseCase,
		useFactory: (
			gameSharedService: GameSharedService,
			repository: IGameRepository,
			eventEmitter: EventEmitter2,
			dictionaryService: DictionaryService,
			roundScheduler: RoundScheduler,
		) =>
			new NextRoundUseCase(
				gameSharedService,
				repository,
				eventEmitter,
				dictionaryService,
				roundScheduler,
			),
		inject: [
			GameSharedService,
			GAME_REPOSITORY,
			EventEmitter2,
			DictionaryService,
			RoundScheduler,
		],
	},
	{
		provide: NextWordUseCase,
		useFactory: (
			gameSharedService: GameSharedService,
			repository: IGameRepository,
			eventEmitter: EventEmitter2,
			dictionaryService: DictionaryService,
		) =>
			new NextWordUseCase(
				gameSharedService,
				repository,
				eventEmitter,
				dictionaryService,
			),
		inject: [
			GameSharedService,
			GAME_REPOSITORY,
			EventEmitter2,
			DictionaryService,
		],
	},
	{
		provide: ChangeWordScoreUseCase,
		useFactory: (
			gameSharedService: GameSharedService,
			repository: IGameRepository,
			eventEmitter: EventEmitter2,
		) =>
			new ChangeWordScoreUseCase(
				gameSharedService,
				repository,
				eventEmitter,
			),
		inject: [GameSharedService, GAME_REPOSITORY, EventEmitter2],
	},
	{
		provide: StartGameUseCase,
		useFactory: (
			gameSharedService: GameSharedService,
			repository: IGameRepository,
			eventEmitter: EventEmitter2,
			dictionaryService: DictionaryService,
		) =>
			new StartGameUseCase(
				gameSharedService,
				repository,
				eventEmitter,
				dictionaryService,
			),
		inject: [
			GameSharedService,
			GAME_REPOSITORY,
			EventEmitter2,
			DictionaryService,
		],
	},
	{
		provide: ToggleReadyUseCase,
		useFactory: (
			gameSharedService: GameSharedService,
			repository: IGameRepository,
			eventEmitter: EventEmitter2,
		) =>
			new ToggleReadyUseCase(gameSharedService, repository, eventEmitter),
		inject: [GameSharedService, GAME_REPOSITORY, EventEmitter2],
	},
	{
		provide: UpdateGameSettingsUseCase,
		useFactory: (
			repository: IGameRepository,
			gameSharedService: GameSharedService,
		) => new UpdateGameSettingsUseCase(repository, gameSharedService),
		inject: [GAME_REPOSITORY, GameSharedService],
	},
	{
		provide: GetGameCodeUseCase,
		useFactory: (gameSharedService: GameSharedService) =>
			new GetGameCodeUseCase(gameSharedService),
		inject: [GameSharedService],
	},
	{
		provide: ValidateCodeUseCase,
		useFactory: (gameSharedService: GameSharedService) =>
			new ValidateCodeUseCase(gameSharedService),
		inject: [GameSharedService],
	},
	{
		provide: GetPrivatePlayerStateUseCase,
		useFactory: (gameSharedService: GameSharedService) =>
			new GetPrivatePlayerStateUseCase(gameSharedService),
		inject: [GameSharedService],
	},
	{
		provide: GetCurrentGameUseCase,
		useFactory: (repository: IGameRepository) =>
			new GetCurrentGameUseCase(repository),
		inject: [GAME_REPOSITORY],
	},
	{
		provide: GetUserRoomUseCase,
		useFactory: (repository: IGameRepository) =>
			new GetUserRoomUseCase(repository),
		inject: [GAME_REPOSITORY],
	},
	{
		provide: KickPlayerUseCase,
		useFactory: (
			repository: IGameRepository,
			gameSharedService: GameSharedService,
			eventEmitter: EventEmitter2,
		) => new KickPlayerUseCase(repository, gameSharedService, eventEmitter),
		inject: [GAME_REPOSITORY, GameSharedService, EventEmitter2],
	},
	{
		provide: SetPlayerOfflineUseCase,
		useFactory: (
			gameSharedService: GameSharedService,
			repository: IGameRepository,
			eventEmitter: EventEmitter2,
		) =>
			new SetPlayerOfflineUseCase(
				gameSharedService,
				repository,
				eventEmitter,
			),
		inject: [GameSharedService, GAME_REPOSITORY, EventEmitter2],
	},
	{
		provide: StartRoundUseCase,
		useFactory: (
			gameSharedService: GameSharedService,
			repository: IGameRepository,
			eventEmitter: EventEmitter2,
			roundScheduler: RoundScheduler,
		) =>
			new StartRoundUseCase(
				gameSharedService,
				repository,
				eventEmitter,
				roundScheduler,
			),
		inject: [
			GameSharedService,
			GAME_REPOSITORY,
			EventEmitter2,
			RoundScheduler,
		],
	},
	{
		provide: ToggleRoundReadyUseCase,
		useFactory: (
			gameSharedService: GameSharedService,
			eventEmitter: EventEmitter2,
			repository: IGameRepository,
		) =>
			new ToggleRoundReadyUseCase(
				gameSharedService,
				eventEmitter,
				repository,
			),
		inject: [GameSharedService, EventEmitter2, GAME_REPOSITORY],
	},
	{
		provide: CreateTeamUseCase,
		useFactory: (
			gameSharedService: GameSharedService,
			repository: IGameRepository,
			eventEmitter: EventEmitter2,
		) => new CreateTeamUseCase(gameSharedService, repository, eventEmitter),
		inject: [GameSharedService, GAME_REPOSITORY, EventEmitter2],
	},
	{
		provide: MoveToTeamUseCase,
		useFactory: (
			gameSharedService: GameSharedService,
			eventEmitter: EventEmitter2,
			repository: IGameRepository,
		) => new MoveToTeamUseCase(gameSharedService, eventEmitter, repository),
		inject: [GameSharedService, EventEmitter2, GAME_REPOSITORY],
	},
	{
		provide: DeleteTeamUseCase,
		useFactory: (
			repository: IGameRepository,
			gameSharedService: GameSharedService,
			eventEmitter: EventEmitter2,
		) => new DeleteTeamUseCase(repository, gameSharedService, eventEmitter),
		inject: [GAME_REPOSITORY, GameSharedService, EventEmitter2],
	},
];

@Module({
	providers: [
		GameGateway,
		GameSharedService,
		RoundScheduler,
		...useCaseProviders,
		GameFacade,
		PlayerFacade,
		RoundFacade,
		TeamFacade,
		DictionaryService,
		{
			provide: GAME_REPOSITORY,
			useClass: RedisGameRepository,
		},
	],
	controllers: [GameController],
	exports: [GameFacade, PlayerFacade, RoundFacade, TeamFacade],
})
export class GameModule {}
