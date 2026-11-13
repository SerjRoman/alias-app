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
import { ChangeWordOutcomeUseCase } from "./application/use-cases/round/change-word-outcome.use-case";
import { CreateGameUseCase } from "./application/use-cases/game/create-game.use-case";
import { DeleteFinishedGameUseCase } from "./application/use-cases/game/delete-finished-game.use-case";
import { DeleteGameUseCase } from "./application/use-cases/game/delete-game.use-case";
import { FindAllGamesUseCase } from "./application/use-cases/game/find-all-games.use-case";
import { FindOneGameUseCase } from "./application/use-cases/game/find-one.use-case";
import { GetGameCodeUseCase } from "./application/use-cases/game/get-game-code.use-case";
import { GetPrivatePlayerStateUseCase } from "./application/use-cases/player/get-private-player-state.use-case";
import { JoinGameUseCase } from "./application/use-cases/game/join-game.use-case";
import { LeaveGameUseCase } from "./application/use-cases/game/leave-game.use-case";
import { NextRoundUseCase } from "./application/use-cases/round/next-round.use-case";
import { NextWordUseCase } from "./application/use-cases/round/next-word.use-case";
import { StartGameUseCase } from "./application/use-cases/game/start-game.use-case";
import { ToggleReadyUseCase } from "./application/use-cases/game/toggle-game-ready.use-case";
import { TransferOwnershipUseCase } from "./application/use-cases/game/transfer-ownership.use-case";
import { UpdateGameSettingsUseCase } from "./application/use-cases/game/update-game-settings.use-case";
import { ValidateCodeUseCase } from "./application/use-cases/game/validate-code.use-case";
import { GetCurrentGameUseCase } from "./application/use-cases/player/get-current-game.use-case";
import { KickPlayerUseCase } from "./application/use-cases/player/kick-player.use-case";
import { SetPlayerOfflineUseCase } from "./application/use-cases/player/set-player-offline.use-case";
import { BanPlayerUseCase } from "./application/use-cases/player/ban-player.use-case";
import { SubmitCustomWordsUseCase } from "./application/use-cases/player/submit-custom-words.use-case";
import { StartRoundUseCase } from "./application/use-cases/round/start-round.use-case";
import { ToggleRoundReadyUseCase } from "./application/use-cases/round/toggle-round-ready.use-case";
import { CreateTeamUseCase } from "./application/use-cases/team/create-team.use-case";
import { DeleteTeamUseCase } from "./application/use-cases/team/delete-team.use-case";
import { MoveToTeamUseCase } from "./application/use-cases/team/move-to-team.use-case";
import { MoveToSpectatorsUseCase } from "./application/use-cases/team/move-to-spectators.use-case";
import { EndPointingUseCase } from "./application/use-cases/round/end-pointing.use-case";
import { EndGameUseCase } from "./application/use-cases/game/end-game.use-case";
import { SetExplainerUseCase } from "./application/use-cases/round/set-explainer.use-case";
import { ShufflePlayersUseCase } from "./application/use-cases/game/shuffle-players.use-case";
import { ChangeRoundTimeUseCase } from "./application/use-cases/round/change-round-time.use-case";
import { StartPointingUseCase } from "./application/use-cases/round/start-pointing.use-case";
import { StartRoundForcedUseCase } from "./application/use-cases/round/start-round-forced.use-case";
import { PauseRoundUseCase } from "./application/use-cases/round/pause-round.use-case";
import { ResumeRoundUseCase } from "./application/use-cases/round/resume-round.use-case";
import { GetExplainerWordUseCase } from "./application/use-cases/round/get-explainer-word.use-case";
import {
	BuyItemUseCase,
	UseItemUseCase,
	GetShopCatalogUseCase,
} from "./application/use-cases/shop";
import { DICTIONARY_REPOSITORY } from "./application/dictionary.repository.interface";
import { RedisDictionaryRepository } from "./infrastructure/redis-dictionary.repository";
import { VoiceService } from "./application/voice.service";
import { CleanupGameResourcesHandler } from "./application/handlers/cleanup-game-resources.handler";
import { EffectExpiredHandler } from "./application/handlers/effect-expired.handler";
import { WordPackModule } from "../word-pack/word-pack.module";
import { WORD_PACK_CLIENT } from "./application/word-pack-client.interface";
import { LocalWordPackClient } from "./infrastructure/local-word-pack-client";
import { RoomFifoQueueService } from "./application/room-fifo-queue.service";
import { RedisChatRepository } from "./infrastructure/redis-chat.repository";
import { GameChatService } from "./application/chat/game-chat.service";
import { ChatSystemEventsListener } from "./application/chat/chat-system-events.listener";

@Module({
	imports: [WordPackModule],
	providers: [
		RoomFifoQueueService,
		GameGateway,
		GameSharedService,
		RoundScheduler,
		DictionaryService,
		VoiceService,
		CleanupGameResourcesHandler,
		EffectExpiredHandler,
		RedisChatRepository,
		GameChatService,
		ChatSystemEventsListener,
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
		ChangeWordOutcomeUseCase,
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
		TransferOwnershipUseCase,
		UpdateGameSettingsUseCase,
		ValidateCodeUseCase,
		GetCurrentGameUseCase,
		KickPlayerUseCase,
		SetPlayerOfflineUseCase,
		BanPlayerUseCase,
		SubmitCustomWordsUseCase,
		StartRoundUseCase,
		ToggleRoundReadyUseCase,
		CreateTeamUseCase,
		DeleteTeamUseCase,
		MoveToTeamUseCase,
		MoveToSpectatorsUseCase,
		EndPointingUseCase,
		EndGameUseCase,
		SetExplainerUseCase,
		ShufflePlayersUseCase,
		ChangeRoundTimeUseCase,
		StartPointingUseCase,
		StartRoundForcedUseCase,
		PauseRoundUseCase,
		ResumeRoundUseCase,
		GetExplainerWordUseCase,
		BuyItemUseCase,
		UseItemUseCase,
		GetShopCatalogUseCase,
	],
	controllers: [GameController],
	exports: [
		RoomFifoQueueService,
		GameFacade,
		PlayerFacade,
		RoundFacade,
		TeamFacade,
	],
})
export class GameModule {}
