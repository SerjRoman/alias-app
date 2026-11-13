import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
	ItemPurchasedDomainEvent,
	ItemUsedDomainEvent,
	RoundEndedDomainEvent,
	RoundStartedDomainEvent,
	type GameState,
	type TeamState,
} from "../../domain";
import {
	GAME_UPDATED,
	TEAMS_UPDATED,
	type GameUpdatedPayload,
	type TeamsUpdatedPayload,
} from "../game.events";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../game.repository.interface";
import { RedisChatRepository } from "../../infrastructure/redis-chat.repository";
import { GameChatService } from "./game-chat.service";
import {
	ADMIN_ACTION_EXECUTED,
	SYSTEM_LOG_KEYS,
	type AdminActionExecutedPayload,
} from "./chat.types";

@Injectable()
export class ChatSystemEventsListener {
	private readonly logger = new Logger(ChatSystemEventsListener.name);

	constructor(
		@Inject(GAME_REPOSITORY)
		private readonly gameRepository: IGameRepository,
		private readonly chatRepository: RedisChatRepository,
		private readonly chatService: GameChatService,
	) {}

	@OnEvent(ItemUsedDomainEvent.eventName)
	async handleItemUsed(event: ItemUsedDomainEvent): Promise<void> {
		try {
			const engine = await this.gameRepository.findGameById(event.roomId);
			if (!engine) return;
			const state = engine.getState();

			const playerName =
				state.players.find((p) => p.id === event.playerId)?.name ??
				"Player";

			if (event.targetPlayerId) {
				const targetName =
					state.players.find((p) => p.id === event.targetPlayerId)
						?.name ?? "Player";
				await this.chatService.emitPublicSystemLog(
					event.roomId,
					"effect",
					SYSTEM_LOG_KEYS.ITEM_USED_PLAYER,
					{
						playerName,
						itemId: event.itemId,
						targetName,
					},
				);
				return;
			}

			if (event.targetTeamId) {
				const teamName =
					state.teams.find((t) => t.id === event.targetTeamId)
						?.name ?? "Team";
				await this.chatService.emitPublicSystemLog(
					event.roomId,
					"effect",
					SYSTEM_LOG_KEYS.ITEM_USED_TEAM,
					{
						playerName,
						itemId: event.itemId,
						targetName: teamName,
					},
				);
				return;
			}

			await this.chatService.emitPublicSystemLog(
				event.roomId,
				"effect",
				SYSTEM_LOG_KEYS.ITEM_USED_SELF,
				{
					playerName,
					itemId: event.itemId,
				},
			);
		} catch (error) {
			this.logger.error(`Failed handling ItemUsedDomainEvent: ${error}`);
		}
	}

	@OnEvent(ItemPurchasedDomainEvent.eventName)
	async handleItemPurchased(event: ItemPurchasedDomainEvent): Promise<void> {
		try {
			await this.chatService.emitPrivateSystemLog(
				event.roomId,
				event.playerId,
				SYSTEM_LOG_KEYS.ITEM_PURCHASED_PRIVATE,
				{
					itemId: event.itemId,
					cost: event.cost,
					balance: event.remainingBalance,
				},
			);
		} catch (error) {
			this.logger.error(
				`Failed handling ItemPurchasedDomainEvent: ${error}`,
			);
		}
	}

	@OnEvent(RoundStartedDomainEvent.eventName)
	async handleRoundStarted(event: RoundStartedDomainEvent): Promise<void> {
		try {
			const engine = await this.gameRepository.findGameById(event.roomId);
			if (!engine) return;
			const state = engine.getState();

			const roundNumber = state.currentRound?.roundNumber ?? 1;
			const teamName =
				state.teams.find((t) => t.id === event.teamId)?.name ?? "Team";
			const explainerName =
				state.players.find((p) => p.id === event.explainerId)?.name ??
				"Player";

			await this.chatService.emitPublicSystemLog(
				event.roomId,
				"round",
				SYSTEM_LOG_KEYS.ROUND_STARTED,
				{
					roundNumber,
					teamName,
					explainerName,
				},
			);
		} catch (error) {
			this.logger.error(
				`Failed handling RoundStartedDomainEvent: ${error}`,
			);
		}
	}

	@OnEvent(RoundEndedDomainEvent.eventName)
	async handleRoundEnded(event: RoundEndedDomainEvent): Promise<void> {
		try {
			let state: GameState | undefined = event.gameState?.id
				? event.gameState
				: undefined;
			if (!state) {
				const engine = await this.gameRepository.findGameById(
					event.roomId,
				);
				state = engine?.getState();
			}
			if (!state) return;

			const round = state.currentRound;
			const roundNumber = round?.roundNumber ?? 1;
			const earnedPoints =
				round?.words?.reduce((sum, w) => sum + w.score, 0) ?? 0;
			const teamName =
				state.teams.find((t) => t.id === event.teamId)?.name ?? "Team";

			await this.chatService.emitPublicSystemLog(
				event.roomId,
				"round",
				SYSTEM_LOG_KEYS.ROUND_ENDED,
				{
					roundNumber,
					teamName,
					earnedPoints,
				},
			);

			await this.checkLeaderChange(event.roomId, state.teams);
		} catch (error) {
			this.logger.error(
				`Failed handling RoundEndedDomainEvent: ${error}`,
			);
		}
	}

	@OnEvent(TEAMS_UPDATED)
	async handleTeamsUpdated(payload: TeamsUpdatedPayload): Promise<void> {
		try {
			await this.checkLeaderChange(payload.roomId, payload.teams);
		} catch (error) {
			this.logger.error(`Failed handling TEAMS_UPDATED: ${error}`);
		}
	}

	@OnEvent(GAME_UPDATED)
	async handleGameUpdated(payload: GameUpdatedPayload): Promise<void> {
		try {
			await this.checkLeaderChange(payload.room.id, payload.room.teams);
		} catch (error) {
			this.logger.error(`Failed handling GAME_UPDATED: ${error}`);
		}
	}

	@OnEvent(ADMIN_ACTION_EXECUTED)
	async handleAdminAction(
		payload: AdminActionExecutedPayload,
	): Promise<void> {
		try {
			const engine = await this.gameRepository.findGameById(
				payload.roomId,
			);
			const state = engine?.getState();

			let targetName = payload.targetName ?? "";
			if (!targetName && payload.targetPlayerId && state) {
				targetName =
					state.players.find((p) => p.id === payload.targetPlayerId)
						?.name ?? payload.targetPlayerId;
			} else if (!targetName && payload.targetTeamId && state) {
				targetName =
					state.teams.find((t) => t.id === payload.targetTeamId)
						?.name ?? payload.targetTeamId;
			}

			const params: Record<string, string | number> = {
				adminName: payload.adminName,
			};
			if (targetName) params.targetName = targetName;
			if (payload.seconds !== undefined) params.seconds = payload.seconds;

			await this.chatService.emitPublicSystemLog(
				payload.roomId,
				"admin",
				SYSTEM_LOG_KEYS.adminAction(payload.action),
				params,
			);
		} catch (error) {
			this.logger.error(
				`Failed handling ADMIN_ACTION_EXECUTED: ${error}`,
			);
		}
	}

	private async checkLeaderChange(
		roomId: string,
		teams: TeamState[],
	): Promise<void> {
		if (!teams || teams.length < 2) return;

		const sorted = [...teams].sort((a, b) => b.score - a.score);
		const top = sorted[0];
		const second = sorted[1];

		const soleLeader =
			top && top.score > 0 && (!second || top.score > second.score)
				? top
				: null;

		const prevLeaderId =
			await this.chatRepository.getLastLeaderTeamId(roomId);

		if (soleLeader && soleLeader.id !== prevLeaderId) {
			await this.chatRepository.setLastLeaderTeamId(
				roomId,
				soleLeader.id,
			);
			await this.chatService.emitPublicSystemLog(
				roomId,
				"leader",
				SYSTEM_LOG_KEYS.NEW_LEADER,
				{
					teamName: soleLeader.name,
					score: soleLeader.score,
				},
			);
		} else if (!soleLeader && prevLeaderId) {
			await this.chatRepository.setLastLeaderTeamId(roomId, null);
		}
	}
}
