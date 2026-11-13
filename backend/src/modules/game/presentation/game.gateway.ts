import { Logger, UseFilters } from "@nestjs/common";
import { GameFacade } from "../application/facades/game.facade";
import { PlayerFacade } from "../application/facades/player.facade";
import { RoundFacade } from "../application/facades/round.facade";
import { TeamFacade } from "../application/facades/team.facade";
import {
	ConnectedSocket,
	MessageBody,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import {
	GAME_UPDATED,
	type GameUpdatedPayload,
	GAME_SETTINGS_UPDATED,
	type GameSettingsUpdatedPayload,
	type PlayerKickedPayload,
	PLAYER_KICKED,
	GAME_STARTED,
	type GameStartedPayload,
	TEAMS_UPDATED,
	type TeamsUpdatedPayload,
	PLAYERS_UPDATED,
	type PlayersUpdatedPayload,
	ROUND_UPDATED,
	type RoundUpdatedPayload,
	GAME_FINISHED,
	type GameFinishedPayload,
} from "../application/game.events";
import { plainToInstance } from "class-transformer";
import { GameDeletedEvent } from "../domain";

import type { GameServer, GameSocket } from "./game.socket-types";
import { AuthenticatedSocket } from "../../../common/types/socket";
import { UserDto } from "@common/dto/user.dto";
import { WsExceptionsFilter } from "./filters/ws-exceptions.filter";
import {
	JoinGameDto,
	KickPlayerDto,
	BanPlayerDto,
	UpdateGameSettingsDto,
	CreateTeamDto,
	MoveToTeamDto,
	DeleteTeamDto,
	PlayerLeaveRoomBodyDto,
	NextWordDto,
	NextRoundDto,
	StartRoundDto,
	ChangeWordOutcomeDto,
	DeleteGameDto,
	EndPointingDto,
	EndGameDto,
	ShufflePlayersDto,
	ChangeRoundTimeDto,
	StartPointingDto,
	SubmitCustomWordsDto,
	MoveToSpectatorsDto,
	PauseGameDto,
	ResumeGameDto,
	BuyItemDto,
	UseItemDto,
	GetExplainerWordDto,
	GetShopCatalogDto,
	SendChatMessageDto,
	GetChatHistoryDto,
} from "../application/dto/body";
import {
	GameResponseDetailsDto,
	GameUpdateResponseDto,
	TeamResponseDto,
	PlayerResponseDto,
	RoundResponseDto,
	GameSettingsDto,
	PrivatePlayerStateResponseDto,
	ExplainerWordResponseDto,
	ShopCatalogResponseDto,
	ChatActionResponseDto,
	ChatMessageResponseDto,
	SystemLogEntryResponseDto,
	ChatHistoryResponseDto,
} from "../application/dto/response";
import { ADMIN_EVENTS } from "./socket.events";
import { SetExplainerDto } from "../application/dto/body/set-explainer.dto";
import { RoomNotFoundError } from "../domain/errors/game.errors";
import { GameChatService } from "../application/chat/game-chat.service";
import {
	ADMIN_ACTION_EXECUTED,
	CHAT_MESSAGE_CREATED,
	SYSTEM_LOG_CREATED,
	type AdminActionExecutedPayload,
	type AdminActionLogType,
	type ChatMessageCreatedPayload,
	type SystemLogCreatedPayload,
} from "../application/chat/chat.types";

@WebSocketGateway({
	cors: {
		origin: "*",
	},
	namespace: "game-ws",
})
@UseFilters(new WsExceptionsFilter())
export class GameGateway implements OnGatewayDisconnect {
	@WebSocketServer() server: GameServer;

	private readonly logger = new Logger(GameGateway.name);
	private readonly disconnectTimeouts = new Map<string, NodeJS.Timeout>();
	constructor(
		private readonly gameFacade: GameFacade,
		private readonly playerFacade: PlayerFacade,
		private readonly roundFacade: RoundFacade,
		private readonly teamFacade: TeamFacade,
		private readonly gameChatService: GameChatService,
		private readonly eventEmitter: EventEmitter2,
	) {}

	@SubscribeMessage("toggleGameReady")
	async toggleGameReady(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() data: { roomId: string },
	) {
		this.logger.log(
			`Received toggleGameReady from client ${client.id} UserID ${client.data.user.name}`,
		);
		await this.gameFacade.toggleReady(data.roomId, client.data.user);
	}
	@SubscribeMessage("toggleRoundReady")
	async toggleRoundReady(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() data: { roomId: string },
	) {
		this.logger.log(
			`Received toggleRoundReady from client ${client.id} UserID ${client.data.user.name}`,
		);
		await this.roundFacade.toggleRoundReady(data.roomId, client.data.user);
	}

	@SubscribeMessage("joinGame")
	async joinGame(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: JoinGameDto,
	) {
		this.logger.log(
			`Received joinGame from client ${client.id} UserID ${client.data.user.name}`,
		);
		const userId = client.data.user.id;
		if (this.disconnectTimeouts.has(userId)) {
			this.logger.log(
				`User ${client.data.user.name} rejoined within grace period. Cancelling offline status change.`,
			);
			clearTimeout(this.disconnectTimeouts.get(userId));
			this.disconnectTimeouts.delete(userId);
		}

		// Если сокет был подключен к другой комнате — отключаем сокет от старой комнаты
		const { roomId: currentRoomId } =
			await this.playerFacade.getGameIdByUserId(userId);
		if (currentRoomId && currentRoomId !== dto.roomId) {
			this.logger.log(
				`User ${client.data.user.name} is switching from room ${currentRoomId} to ${dto.roomId}`,
			);
			await Promise.resolve(client.leave(currentRoomId));
		}

		const room = await this.gameFacade.joinGame(dto, client.data.user);
		await Promise.resolve(client.join(dto.roomId));
		const publicState = plainToInstance(GameResponseDetailsDto, room, {
			excludeExtraneousValues: true,
		});

		client.emit("gameUpdated", publicState);
		const chatHistory = await this.gameChatService.getHistoryForPlayer(
			room.id,
			client.data.user.id,
		);
		client.emit(
			"chatHistory",
			plainToInstance(ChatHistoryResponseDto, chatHistory, {
				excludeExtraneousValues: true,
			}),
		);
		await this.sendPrivateStateToPlayer(room.id, client.data.user.id);
		if (await this.isExplainer(dto.roomId, client.data.user.id))
			await this.sendPrivateWordToExplainer(room.id, client.data.user.id);

		return publicState;
	}

	@SubscribeMessage("startGame")
	async startGame(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: { roomId: string },
	) {
		await this.gameFacade.startGame(dto.roomId, client.data.user);
	}

	@SubscribeMessage("submitCustomWords")
	async submitCustomWords(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: SubmitCustomWordsDto,
	) {
		this.logger.log(
			`Received submitCustomWords from client ${client.id} UserID ${client.data.user.name}`,
		);
		const room = await this.playerFacade.submitCustomWords(
			dto,
			client.data.user,
		);
		return plainToInstance(GameResponseDetailsDto, room, {
			excludeExtraneousValues: true,
		});
	}

	@SubscribeMessage("updateGameSettings")
	async updateGameSettings(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: UpdateGameSettingsDto,
	) {
		await this.gameFacade.updateGameSettings(dto, client.data.user);
	}
	@SubscribeMessage("createTeam")
	async createTeam(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: CreateTeamDto,
	) {
		await this.teamFacade.createTeam(dto, client.data.user);
	}
	@SubscribeMessage("moveToTeam")
	async moveToTeam(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: MoveToTeamDto,
	) {
		await this.teamFacade.moveToTeam(dto, client.data.user);
	}

	@SubscribeMessage("moveToSpectators")
	async moveToSpectators(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: MoveToSpectatorsDto,
	) {
		await this.teamFacade.moveToSpectators(dto, client.data.user);
	}

	@SubscribeMessage("deleteTeam")
	async deleteTeam(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: DeleteTeamDto,
	) {
		await this.teamFacade.deleteTeam(dto, client.data.user);
	}
	@SubscribeMessage("leaveGame")
	async leaveGame(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() body: PlayerLeaveRoomBodyDto,
	) {
		this.logger.log(
			`Received leaveGame from client ${client.id} UserID ${client.data.user.name}`,
		);
		const userId = client.data.user.id;
		if (this.disconnectTimeouts.has(userId)) {
			clearTimeout(this.disconnectTimeouts.get(userId));
			this.disconnectTimeouts.delete(userId);
		}
		await this.gameFacade.leaveGame(body.roomId, client.data.user);
		return { success: true };
	}

	@SubscribeMessage("nextWord")
	async nextWord(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: NextWordDto,
	) {
		const data = await this.gameFacade.nextWord(dto, client.data.user);
		await this.sendPrivateWordToExplainer(dto.roomId, client.data.user.id);
		return plainToInstance(ExplainerWordResponseDto, data.newWord, {
			excludeExtraneousValues: true,
		});
	}
	@SubscribeMessage("nextRound")
	async nextRound(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: NextRoundDto,
	) {
		await this.gameFacade.nextRound(dto, client.data.user);
	}
	@SubscribeMessage("endPointing")
	async endPointing(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: EndPointingDto,
	) {
		this.logger.log(
			`Received endPointing from client ${client.id} UserID ${client.data.user.name}`,
		);
		await this.roundFacade.endPointing(dto, client.data.user);
		await this.broadcastPrivateStatesToRoom(dto.roomId);
	}
	@SubscribeMessage("startRound")
	async startRound(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: StartRoundDto,
	) {
		await this.roundFacade.startRound(dto, client.data.user);
		const isExplainer = await this.isExplainer(
			dto.roomId,
			client.data.user.id,
		);
		if (isExplainer) {
			await this.sendPrivateWordToExplainer(
				dto.roomId,
				client.data.user.id,
			);
		}
	}

	@SubscribeMessage("changeWordOutcome")
	async changeWordOutcome(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: ChangeWordOutcomeDto,
	) {
		await this.gameFacade.changeWordOutcome(dto, client.data.user);
	}
	@SubscribeMessage("deleteGame")
	async deleteGame(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: DeleteGameDto,
	) {
		await this.gameFacade.deleteGame(dto, client.data.user);
	}

	@SubscribeMessage(ADMIN_EVENTS.assignPlayerToTeam)
	async assignPlayerToTeam(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: MoveToTeamDto,
	) {
		await this.teamFacade.moveToTeam(dto, client.data.user);
		this.emitAdminActionLog(dto.roomId, client.data.user, "assignPlayerToTeam", {
			targetPlayerId: dto.playerId,
			targetTeamId: dto.teamId,
		});
	}
	@SubscribeMessage(ADMIN_EVENTS.kickPlayer)
	async kickPlayer(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: KickPlayerDto,
	) {
		const targetName = await this.resolvePlayerName(dto.roomId, dto.playerId);
		await this.playerFacade.kickPlayer(dto, client.data.user);
		this.emitAdminActionLog(dto.roomId, client.data.user, "kickPlayer", {
			targetPlayerId: dto.playerId,
			targetName,
		});
	}
	@SubscribeMessage(ADMIN_EVENTS.banPlayer)
	async banPlayer(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: BanPlayerDto,
	) {
		const targetName = await this.resolvePlayerName(dto.roomId, dto.playerId);
		await this.playerFacade.banPlayer(dto, client.data.user);
		this.emitAdminActionLog(dto.roomId, client.data.user, "banPlayer", {
			targetPlayerId: dto.playerId,
			targetName,
		});
	}
	@SubscribeMessage(ADMIN_EVENTS.endGame)
	async endGame(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: EndGameDto,
	) {
		await this.gameFacade.endGame(dto, client.data.user);
		this.emitAdminActionLog(dto.roomId, client.data.user, "endGame");
	}
	@SubscribeMessage(ADMIN_EVENTS.setExplainer)
	async setExplainer(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: SetExplainerDto,
	) {
		await this.roundFacade.setExplainer(dto, client.data.user);
		await this.sendPrivateWordToExplainer(dto.roomId, dto.playerId);
		this.emitAdminActionLog(dto.roomId, client.data.user, "setExplainer", {
			targetPlayerId: dto.playerId,
		});
	}
	@SubscribeMessage(ADMIN_EVENTS.shufflePlayers)
	async shufflePlayers(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: ShufflePlayersDto,
	) {
		await this.gameFacade.shufflePlayers(dto, client.data.user);
		this.emitAdminActionLog(dto.roomId, client.data.user, "shufflePlayers");
	}
	@SubscribeMessage(ADMIN_EVENTS.changeRoundTime)
	async changeRoundTime(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: ChangeRoundTimeDto,
	) {
		await this.roundFacade.changeRoundTime(dto, client.data.user);
		this.emitAdminActionLog(dto.roomId, client.data.user, "changeRoundTime", {
			seconds: dto.seconds,
		});
	}
	@SubscribeMessage(ADMIN_EVENTS.startPointing)
	async startPointing(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: StartPointingDto,
	) {
		await this.roundFacade.startPointing(dto, client.data.user);
		this.emitAdminActionLog(dto.roomId, client.data.user, "startPointing");
	}
	@SubscribeMessage(ADMIN_EVENTS.startRound)
	async startRoundForced(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: StartRoundDto,
	) {
		const data = await this.roundFacade.startRoundForced(
			dto,
			client.data.user,
		);
		await this.sendPrivateWordToExplainer(
			data.roomId,
			data.round.explainerId,
		);
		this.emitAdminActionLog(dto.roomId, client.data.user, "startRound");
	}

	@SubscribeMessage("pauseGame")
	@SubscribeMessage(ADMIN_EVENTS.pauseGame)
	async pauseGame(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: PauseGameDto,
	) {
		await this.gameFacade.pauseGame(dto, client.data.user);
		this.emitAdminActionLog(dto.roomId, client.data.user, "pauseGame");
	}

	@SubscribeMessage("resumeGame")
	@SubscribeMessage(ADMIN_EVENTS.resumeGame)
	async resumeGame(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: ResumeGameDto,
	) {
		await this.gameFacade.resumeGame(dto, client.data.user);
		this.emitAdminActionLog(dto.roomId, client.data.user, "resumeGame");
	}

	@SubscribeMessage("buyItem")
	async buyItem(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: BuyItemDto,
	): Promise<PrivatePlayerStateResponseDto | null> {
		await this.gameFacade.buyItem(dto, client.data.user);
		const privateState = await this.gameFacade.getPrivatePlayerState(
			dto.roomId,
			client.data.user.id,
		);
		if (!privateState) return null;
		return plainToInstance(PrivatePlayerStateResponseDto, privateState, {
			excludeExtraneousValues: true,
		});
	}

	@SubscribeMessage("useItem")
	async useItem(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: UseItemDto,
	): Promise<PrivatePlayerStateResponseDto | null> {
		await this.gameFacade.useItem(dto, client.data.user);
		const privateState = await this.gameFacade.getPrivatePlayerState(
			dto.roomId,
			client.data.user.id,
		);
		if (!privateState) return null;
		return plainToInstance(PrivatePlayerStateResponseDto, privateState, {
			excludeExtraneousValues: true,
		});
	}

	@SubscribeMessage("getPrivateState")
	async getPrivateState(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() data: { roomId: string },
	): Promise<PrivatePlayerStateResponseDto | null> {
		const privateState = await this.gameFacade.getPrivatePlayerState(
			data.roomId,
			client.data.user.id,
		);
		if (!privateState) return null;
		return plainToInstance(PrivatePlayerStateResponseDto, privateState, {
			excludeExtraneousValues: true,
		});
	}

	@SubscribeMessage("getExplainerWord")
	async getExplainerWord(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: GetExplainerWordDto,
	): Promise<ExplainerWordResponseDto | null> {
		return this.roundFacade.getExplainerWord(dto, client.data.user);
	}

	@SubscribeMessage("getShopCatalog")
	async getShopCatalog(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: GetShopCatalogDto,
	): Promise<ShopCatalogResponseDto> {
		return this.gameFacade.getShopCatalog(dto, client.data.user);
	}

	@SubscribeMessage("sendChatMessage")
	async sendChatMessage(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: SendChatMessageDto,
	): Promise<ChatActionResponseDto> {
		const res = await this.gameChatService.sendPlayerMessage(
			client.data.user,
			dto,
		);
		return plainToInstance(ChatActionResponseDto, res, {
			excludeExtraneousValues: true,
		});
	}

	@SubscribeMessage("getChatHistory")
	async getChatHistory(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: GetChatHistoryDto,
	): Promise<ChatHistoryResponseDto> {
		const history = await this.gameChatService.getHistoryForPlayer(
			dto.roomId,
			client.data.user.id,
		);
		return plainToInstance(ChatHistoryResponseDto, history, {
			excludeExtraneousValues: true,
		});
	}

	private async resolvePlayerName(
		roomId: string,
		playerId: string,
	): Promise<string | undefined> {
		try {
			const game = await this.gameFacade.findOne(roomId);
			return game.players.find((p) => p.id === playerId)?.name;
		} catch {
			return undefined;
		}
	}

	private emitAdminActionLog(
		roomId: string,
		admin: UserDto,
		action: AdminActionLogType,
		extra?: Partial<
			Pick<
				AdminActionExecutedPayload,
				"targetPlayerId" | "targetTeamId" | "targetName" | "seconds"
			>
		>,
	): void {
		const payload: AdminActionExecutedPayload = {
			roomId,
			adminId: admin.id,
			adminName: admin.name,
			action,
			...extra,
		};
		this.eventEmitter.emit(ADMIN_ACTION_EXECUTED, payload);
	}

	private async isExplainer(
		roomId: string,
		userId: string,
	): Promise<boolean> {
		const wordDto = await this.roundFacade.getExplainerWord(
			{ roomId },
			plainToInstance(UserDto, { id: userId }),
		);
		return Boolean(wordDto);
	}

	private async sendPrivateWordToExplainer(
		roomId: string,
		explainerId: string,
	) {
		let wordDto: ExplainerWordResponseDto | null;
		try {
			wordDto = await this.roundFacade.getExplainerWord(
				{ roomId },
				plainToInstance(UserDto, { id: explainerId }),
			);
		} catch (error) {
			if (error instanceof RoomNotFoundError) {
				this.logger.warn(
					`Skipped explainer word send because room ${roomId} was not found`,
				);
				return;
			}
			throw error;
		}
		if (wordDto) {
			const sockets = await this.server.in(roomId).fetchSockets();
			const targetSocket = sockets.find(
				(socket) =>
					(socket as unknown as AuthenticatedSocket).data.user.id ===
					explainerId,
			) as unknown as AuthenticatedSocket;
			if (targetSocket) {
				targetSocket.emit("explainerWord", wordDto);
				this.logger.log(
					`Sent explainer word to explainer ${targetSocket.data.user.name}`,
				);
			}
		}
	}

	private async sendPrivateStateToPlayer(roomId: string, userId: string) {
		try {
			const privateState = await this.gameFacade.getPrivatePlayerState(
				roomId,
				userId,
			);
			if (!privateState) return;

			const sockets = await this.server.in(roomId).fetchSockets();
			const targetSocket = sockets.find(
				(socket) =>
					(socket as unknown as AuthenticatedSocket).data?.user
						?.id === userId,
			) as unknown as AuthenticatedSocket;

			if (targetSocket) {
				const dto = plainToInstance(
					PrivatePlayerStateResponseDto,
					privateState,
					{
						excludeExtraneousValues: true,
					},
				);
				targetSocket.emit("privateStateUpdated", dto);
			}
		} catch (error) {
			if (error instanceof RoomNotFoundError) {
				return;
			}
			this.logger.error(
				`Failed to send private state to player ${userId}: ${error}`,
			);
		}
	}

	private async broadcastPrivateStatesToRoom(roomId: string) {
		try {
			const sockets = await this.server.in(roomId).fetchSockets();
			for (const socket of sockets) {
				const userId = (socket as unknown as AuthenticatedSocket).data
					?.user?.id;
				if (userId) {
					await this.sendPrivateStateToPlayer(roomId, userId);
				}
			}
		} catch (error) {
			this.logger.error(
				`Error broadcasting private states to room ${roomId}: ${error}`,
			);
		}
	}

	@OnEvent(PLAYER_KICKED)
	async handlePlayerKicked(payload: PlayerKickedPayload) {
		try {
			this.server
				.to(payload.roomId)
				.emit("playerKicked", { kickedUserId: payload.kickedUserId });
			await this.removePlayerFromRoom(
				payload.roomId,
				payload.kickedUserId,
			);
		} catch (error) {
			this.logger.error(
				`Error in handlePlayerKicked: ${error}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
	@OnEvent(GAME_STARTED)
	handleGameStarted(payload: GameStartedPayload) {
		try {
			this.server.to(payload.room.id).emit(
				"gameStarted",
				plainToInstance(GameResponseDetailsDto, payload.room, {
					excludeExtraneousValues: true,
				}),
			);
		} catch (error) {
			this.logger.error(
				`Error in handleGameStarted: ${error}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
	@OnEvent(TEAMS_UPDATED)
	handleTeamUpdated(payload: TeamsUpdatedPayload) {
		try {
			this.server.to(payload.roomId).emit(
				"teamsUpdated",
				plainToInstance(TeamResponseDto, payload.teams, {
					excludeExtraneousValues: true,
				}),
			);
		} catch (error) {
			this.logger.error(
				`Error in handleTeamUpdated: ${error}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}

	@OnEvent(GAME_UPDATED)
	handleGameUpdate(payload: GameUpdatedPayload) {
		try {
			this.server.to(payload.room.id).emit(
				"gameUpdated",
				plainToInstance(GameUpdateResponseDto, payload.room, {
					excludeExtraneousValues: true,
				}),
			);
		} catch (error) {
			this.logger.error(
				`Error in handleGameUpdate: ${error}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}

	@OnEvent(GAME_SETTINGS_UPDATED)
	handleGameSettingsUpdate(payload: GameSettingsUpdatedPayload) {
		try {
			this.server.to(payload.roomId).emit(
				"gameSettingsUpdated",
				plainToInstance(GameSettingsDto, payload.settings, {
					excludeExtraneousValues: true,
				}),
			);
		} catch (error) {
			this.logger.error(
				`Error in handleGameSettingsUpdate: ${error}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
	@OnEvent(PLAYERS_UPDATED)
	handlePlayerReadyUpdate(payload: PlayersUpdatedPayload) {
		try {
			this.server.to(payload.roomId).emit(
				"playersUpdated",
				plainToInstance(PlayerResponseDto, payload.players, {
					excludeExtraneousValues: true,
				}),
			);
		} catch (error) {
			this.logger.error(
				`Error in handlePlayerReadyUpdate: ${error}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
	@OnEvent(ROUND_UPDATED)
	handleRoundUpdated(payload: RoundUpdatedPayload) {
		try {
			this.server.to(payload.roomId).emit(
				"roundUpdated",
				plainToInstance(RoundResponseDto, payload.round, {
					excludeExtraneousValues: true,
				}),
			);
		} catch (error) {
			this.logger.error(
				`Error in handleRoundUpdated: ${error}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
	@OnEvent(GAME_FINISHED)
	handleGameFinished(payload: GameFinishedPayload) {
		try {
			this.server.to(payload.room.id).emit("gameFinished");
		} catch (error) {
			this.logger.error(
				`Error in handleGameFinished: ${error}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
	@OnEvent(GameDeletedEvent.eventName)
	handleGameDeleted(payload: GameDeletedEvent) {
		try {
			this.server
				.to(payload.roomId)
				.emit("gameDeleted", { roomId: payload.roomId });
		} catch (error) {
			this.logger.error(
				`Error in handleGameDeleted: ${error}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}

	@OnEvent(CHAT_MESSAGE_CREATED)
	async handleChatMessageCreated(payload: ChatMessageCreatedPayload) {
		try {
			const { roomId, message } = payload;
			const dto = plainToInstance(ChatMessageResponseDto, message, {
				excludeExtraneousValues: true,
			});
			if (message.channel === "all") {
				this.server.to(roomId).emit("chatMessage", dto);
				return;
			}

			if (!message.teamId) return;
			const game = await this.gameFacade.findOne(roomId);
			const teamMemberIds = new Set(
				game.players
					.filter((p) => p.teamId === message.teamId)
					.map((p) => p.id),
			);

			const sockets = await this.server.in(roomId).fetchSockets();
			for (const socket of sockets) {
				const authSocket = socket as unknown as AuthenticatedSocket;
				const userId = authSocket.data?.user?.id;
				if (userId && teamMemberIds.has(userId)) {
					authSocket.emit("chatMessage", dto);
				}
			}
		} catch (error) {
			this.logger.error(
				`Error in handleChatMessageCreated: ${error}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}

	@OnEvent(SYSTEM_LOG_CREATED)
	async handleSystemLogCreated(payload: SystemLogCreatedPayload) {
		try {
			const { roomId, log } = payload;
			const dto = plainToInstance(SystemLogEntryResponseDto, log, {
				excludeExtraneousValues: true,
			});
			if (log.isPrivate && log.targetUserId) {
				const sockets = await this.server.in(roomId).fetchSockets();
				for (const socket of sockets) {
					const authSocket = socket as unknown as AuthenticatedSocket;
					if (authSocket.data?.user?.id === log.targetUserId) {
						authSocket.emit("systemLog", dto);
					}
				}
				return;
			}

			this.server.to(roomId).emit("systemLog", dto);
		} catch (error) {
			this.logger.error(
				`Error in handleSystemLogCreated: ${error}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
	async handleDisconnect(client: AuthenticatedSocket) {
		try {
			this.logger.log(
				`Received disconnect from client ${client.id} UserID ${client.data?.user?.name || "unknown"}`,
			);
			if (!client.data?.user?.id) return;

			const { roomId } = await this.playerFacade.getGameIdByUserId(
				client.data.user.id,
			);
			if (!roomId) return;

			const userId = client.data.user.id;

			const sockets = await this.server.in(roomId).fetchSockets();
			const hasOtherActiveSocket = sockets.some(
				(socket) =>
					(socket as unknown as AuthenticatedSocket).data?.user
						?.id === userId && socket.id !== client.id,
			);

			if (hasOtherActiveSocket) {
				this.logger.log(
					`User ${client.data.user.name} has another active connection. Skipping offline timeout.`,
				);
				return;
			}

			if (this.disconnectTimeouts.has(userId)) {
				clearTimeout(this.disconnectTimeouts.get(userId));
			}

			const timeout = setTimeout(() => {
				void (async () => {
					this.disconnectTimeouts.delete(userId);
					try {
						const game = await this.gameFacade.findOne(roomId);
						if (game.spectators?.includes(userId)) {
							this.logger.log(
								`Grace period expired for spectator ${client.data?.user?.name || "unknown"}. Leaving game.`,
							);
							await this.gameFacade.leaveGame(
								roomId,
								client.data.user,
							);
						} else {
							this.logger.log(
								`Grace period expired for user ${client.data?.user?.name || "unknown"}. Marking offline.`,
							);
							await this.playerFacade.setPlayerOffline(
								roomId,
								client.data.user,
							);
						}
					} catch (err) {
						this.logger.error(
							`Error in offline grace period timeout for user ${userId}: ${err}`,
						);
					}
				})();
			}, 5000);

			this.disconnectTimeouts.set(userId, timeout);
		} catch (error) {
			this.logger.error(
				`Error occurred while handling disconnect for client ${client.id}: ${error}`,
			);
		}
	}

	private async removePlayerFromRoom(roomId: string, playerId: string) {
		try {
			const sockets = await this.server.in(roomId).fetchSockets();
			const targetSocket = sockets.find(
				(socket) =>
					(socket as unknown as AuthenticatedSocket).data?.user
						?.id === playerId,
			);
			if (targetSocket) {
				targetSocket.leave(roomId);
			}
		} catch (error) {
			this.logger.error(
				`Error in removePlayerFromRoom for player ${playerId} in room ${roomId}: ${error}`,
				error instanceof Error ? error.stack : undefined,
			);
		}
	}
}
