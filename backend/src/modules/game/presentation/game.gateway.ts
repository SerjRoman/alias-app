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
import { OnEvent } from "@nestjs/event-emitter";
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

import type { GameServer, GameSocket } from "./game.socket-types";
import { AuthenticatedSocket } from "../../../common/types/socket";
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
	ChangeWordScoreDto,
	DeleteGameDto,
	EndPointingDto,
	FinishRoundDto,
	EndGameDto,
	ShufflePlayersDto,
	ChangeRoundTimeDto,
	StartPointingDto,
	SubmitCustomWordsDto,
} from "../application/dto/body";
import {
	GameResponseDetailsDto,
	GameUpdateResponseDto,
	WordResponseDto,
	TeamResponseDto,
	PlayerResponseDto,
	RoundResponseDto,
	GameSettingsDto,
} from "../application/dto/response";
import { ADMIN_EVENTS } from "./socket.events";
import { SetGuesserDto } from "../application/dto/body/set-guesser.dto";
import { RoomNotFoundError } from "../domain/errors/game.errors";

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
	private disconnectTimeouts = new Map<string, NodeJS.Timeout>();
	constructor(
		private readonly gameFacade: GameFacade,
		private readonly playerFacade: PlayerFacade,
		private readonly roundFacade: RoundFacade,
		private readonly teamFacade: TeamFacade,
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

		// Если игрок уже в другой комнате — выходим из неё
		const { roomId: currentRoomId } =
			await this.playerFacade.getGameIdByUserId(userId);
		if (currentRoomId && currentRoomId !== dto.roomId) {
			this.logger.log(
				`User ${client.data.user.name} is in room ${currentRoomId}, leaving before joining ${dto.roomId}`,
			);
			await this.gameFacade.leaveGame(currentRoomId, client.data.user);
			client.leave(currentRoomId);
		}

		const room = await this.gameFacade.joinGame(dto, client.data.user);
		await client.join(dto.roomId);
		const publicState = plainToInstance(GameResponseDetailsDto, room, {
			excludeExtraneousValues: true,
		});

		client.emit("gameUpdated", publicState);
		if (await this.isGuesser(dto.roomId, client.data.user.id))
			await this.sendPrivateWordToGuesser(room.id, client.data.user.id);

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
		return plainToInstance(WordResponseDto, data.newWord, {
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
	}
	@SubscribeMessage("startRound")
	async startRound(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: StartRoundDto,
	) {
		await this.roundFacade.startRound(dto, client.data.user);
		const isGuesser = await this.isGuesser(dto.roomId, client.data.user.id);
		if (isGuesser) {
			await this.sendPrivateWordToGuesser(
				dto.roomId,
				client.data.user.id,
			);
		}
	}

	@SubscribeMessage("changeWordScore")
	async changeWordScore(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: ChangeWordScoreDto,
	) {
		await this.gameFacade.changeWordScore(dto, client.data.user);
	}
	@SubscribeMessage("deleteGame")
	async deleteGame(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: DeleteGameDto,
	) {
		await this.gameFacade.deleteGame(dto, client.data.user);
	}
	@SubscribeMessage("finishRound")
	async finishRound(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: FinishRoundDto,
	) {
		await this.roundFacade.finishRound(dto, client.data.user);
	}

	@SubscribeMessage(ADMIN_EVENTS.assignPlayerToTeam)
	async assignPlayerToTeam(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: MoveToTeamDto,
	) {
		await this.teamFacade.moveToTeam(dto, client.data.user);
	}
	@SubscribeMessage(ADMIN_EVENTS.kickPlayer)
	async kickPlayer(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: KickPlayerDto,
	) {
		await this.playerFacade.kickPlayer(dto, client.data.user);
	}
	@SubscribeMessage(ADMIN_EVENTS.banPlayer)
	async banPlayer(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: BanPlayerDto,
	) {
		await this.playerFacade.banPlayer(dto, client.data.user);
	}
	@SubscribeMessage(ADMIN_EVENTS.endGame)
	async endGame(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: EndGameDto,
	) {
		await this.gameFacade.endGame(dto, client.data.user);
	}
	@SubscribeMessage(ADMIN_EVENTS.setGuesser)
	async setGuesser(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: SetGuesserDto,
	) {
		await this.roundFacade.setGuesser(dto, client.data.user);
	}
	@SubscribeMessage(ADMIN_EVENTS.shufflePlayers)
	async shufflePlayers(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: ShufflePlayersDto,
	) {
		await this.gameFacade.shufflePlayers(dto, client.data.user);
	}
	@SubscribeMessage(ADMIN_EVENTS.changeRoundTime)
	async changeRoundTime(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: ChangeRoundTimeDto,
	) {
		await this.roundFacade.changeRoundTime(dto, client.data.user);
	}
	@SubscribeMessage(ADMIN_EVENTS.startPointing)
	async startPointing(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: StartPointingDto,
	) {
		await this.roundFacade.startPointing(dto, client.data.user);
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
		await this.sendPrivateWordToGuesser(data.roomId, data.round.guesserId);
	}
	private async isGuesser(roomId: string, userId: string): Promise<boolean> {
		const privateState = await this.gameFacade.getPrivatePlayerState(
			roomId,
			userId,
		);
		return Boolean(privateState?.word) || false;
	}
	private async sendPrivateWordToGuesser(roomId: string, guesserId: string) {
		let privateState: Awaited<
			ReturnType<GameFacade["getPrivatePlayerState"]>
		>;
		try {
			privateState = await this.gameFacade.getPrivatePlayerState(
				roomId,
				guesserId,
			);
		} catch (error) {
			if (error instanceof RoomNotFoundError) {
				this.logger.warn(
					`Skipped private word send because room ${roomId} was not found`,
				);
				return;
			}
			throw error;
		}
		if (privateState?.word) {
			const sockets = await this.server.in(roomId).fetchSockets();
			const targetSocket = sockets.find(
				(socket) =>
					(socket as unknown as AuthenticatedSocket).data.user.id ===
					guesserId,
			) as unknown as AuthenticatedSocket;
			if (targetSocket) {
				targetSocket.emit(
					"privateWord",
					plainToInstance(WordResponseDto, privateState.word, {
						excludeExtraneousValues: true,
					}),
				);
				this.logger.log(
					`Sent private word to guesser ${targetSocket.data.user.name}`,
				);
			}
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
				"game-settings-updated",
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

			const timeout = setTimeout(async () => {
				this.disconnectTimeouts.delete(userId);
				try {
					this.logger.log(
						`Grace period expired for user ${client.data?.user?.name || "unknown"}. Marking offline.`,
					);
					await this.playerFacade.setPlayerOffline(
						roomId,
						client.data.user,
					);
				} catch (err) {
					this.logger.error(
						`Error in offline grace period timeout for user ${userId}: ${err}`,
					);
				}
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
