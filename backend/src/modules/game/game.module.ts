import { Module } from "@nestjs/common";
import { GameFacade } from "./application/facades/game.facade";
import { PlayerFacade } from "./application/facades/player.facade";
import { RoundFacade } from "./application/facades/round.facade";
import { TeamFacade } from "./application/facades/team.facade";
import { GameSharedService } from "./application/game-shared.service";
import { GameController } from "./presentation/game.controller";
import { GAME_REPOSITORY } from "./application/game.repository.interface";
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
import { BanPlayerUseCase } from "./application/use-cases/player/ban-player.use-case";
import { SubmitCustomWordsUseCase } from "./application/use-cases/player/submit-custom-words.use-case";
import { StartRoundUseCase } from "./application/use-cases/round/start-round.use-case";
import { ToggleRoundReadyUseCase } from "./application/use-cases/round/toggle-round-ready.use-case";
import { CreateTeamUseCase } from "./application/use-cases/team/create-team.use-case";
import { DeleteTeamUseCase } from "./application/use-cases/team/delete-team.use-case";
import { MoveToTeamUseCase } from "./application/use-cases/team/move-to-team.use-case";
import { EndPointingUseCase } from "./application/use-cases/round/end-pointing.use-case";
import { FinishRoundUseCase } from "./application/use-cases/round/finish-round.use-case";
import { EndGameUseCase } from "./application/use-cases/game/end-game.use-case";
import { SetGuesserUseCase } from "./application/use-cases/round/set-guesser.use-case";
import { ShufflePlayersUseCase } from "./application/use-cases/game/shuffle-players.use-case";
import { ChangeRoundTimeUseCase } from "./application/use-cases/round/change-round-time.use-case";
import { StartPointingUseCase } from "./application/use-cases/round/start-pointing.use-case";
import { StartRoundForcedUseCase } from "./application/use-cases/round/start-round-forced.use-case";
import { DICTIONARY_REPOSITORY } from "./application/dictionary.repository.interface";
import { RedisDictionaryRepository } from "./infrastructure/redis-dictionary.repository";
import { VoiceService } from "./application/voice.service";
import { CleanupGameResourcesHandler } from "./application/handlers/cleanup-game-resources.handler";
import { WordPackModule } from "../word-pack/word-pack.module";
import { WORD_PACK_CLIENT } from "./application/word-pack-client.interface";
import { LocalWordPackClient } from "./infrastructure/local-word-pack-client";

@Module({
	imports: [WordPackModule],
	providers: [
		GameGateway,
		GameSharedService,
		RoundScheduler,
		DictionaryService,
		VoiceService,
		CleanupGameResourcesHandler,
		GameFacade,
		PlayerFacade,
		RoundFacade,
		TeamFacade,
		{
			provide: GAME_REPOSITORY,
			useClass: RedisGameRepository,
		},
		{
			provide: DICTIONARY_REPOSITORY,
			useClass: RedisDictionaryRepository,
		},
		{
			provide: WORD_PACK_CLIENT,
			useClass: LocalWordPackClient,
		},
		// Use cases:
		ChangeWordScoreUseCase,
		CreateGameUseCase,
		DeleteFinishedGameUseCase,
		DeleteGameUseCase,
		FindAllGamesUseCase,
		FindOneGameUseCase,
		GetGameCodeUseCase,
		GetPrivatePlayerStateUseCase,
		JoinGameUseCase,
		LeaveGameUseCase,
		NextRoundUseCase,
		NextWordUseCase,
		StartGameUseCase,
		ToggleReadyUseCase,
		UpdateGameSettingsUseCase,
		ValidateCodeUseCase,
		GetCurrentGameUseCase,
		GetUserRoomUseCase,
		KickPlayerUseCase,
		SetPlayerOfflineUseCase,
		BanPlayerUseCase,
		SubmitCustomWordsUseCase,
		StartRoundUseCase,
		ToggleRoundReadyUseCase,
		CreateTeamUseCase,
		DeleteTeamUseCase,
		MoveToTeamUseCase,
		EndPointingUseCase,
		FinishRoundUseCase,
		EndGameUseCase,
		SetGuesserUseCase,
		ShufflePlayersUseCase,
		ChangeRoundTimeUseCase,
		StartPointingUseCase,
		StartRoundForcedUseCase,
	],
	controllers: [GameController],
	exports: [GameFacade, PlayerFacade, RoundFacade, TeamFacade],
})
export class GameModule {}
