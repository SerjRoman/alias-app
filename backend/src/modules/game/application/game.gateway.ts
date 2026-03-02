import { Logger, UseFilters } from "@nestjs/common";
import { GameService } from "./game.service";
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
} from "../events/game.events";
import { plainToInstance } from "class-transformer";
import {
	GameResponseDetailsDto,
	RoundResponseDto,
	TeamResponseDto,
	WordResponseDto,
} from "./dto/response";
import { PlayerResponseDto } from "./dto/response/player.dto";
import type { GameServer, GameSocket } from "./game.socket-types";
import {
	ChangeWordScoreDto,
	CreateTeamDto,
	DeleteGameDto,
	DeleteTeamDto,
	JoinGameDto,
	KickPlayerDto,
	MoveToTeamDto,
	NextRoundDto,
	NextWordDto,
	PlayerLeaveRoomBodyDto,
	StartRoundDto,
	UpdateGameSettingsDto,
} from "./dto/body";
import { GameWsExceptionFilter } from "../filters/game-exception.filter";
import { TeamWsExceptionFilter } from "../filters/team-exception.filter";
import { AuthenticatedSocket } from "../../../common/types/socket";
import { RoundWsExceptionFilter } from "../filters/round-exception.filter";

@WebSocketGateway({
	cors: {
		origin: "*",
	},
	namespace: "game-ws",
})
@UseFilters(
	new GameWsExceptionFilter(),
	new TeamWsExceptionFilter(),
	new RoundWsExceptionFilter(),
)
export class GameGateway implements OnGatewayDisconnect {
	@WebSocketServer() server: GameServer;

	private readonly logger = new Logger(GameGateway.name);
	constructor(private readonly gameService: GameService) {}

	@SubscribeMessage("toggleGameReady")
	async toggleGameReady(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() data: { roomId: string },
	) {
		this.logger.log(
			`Received toggleGameReady from client ${client.id} UserID ${client.data.user.name}`,
		);
		await this.gameService.toggleReady(data.roomId, client.data.user);
	}
	@SubscribeMessage("toggleRoundReady")
	async toggleRoundReady(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() data: { roomId: string },
	) {
		this.logger.log(
			`Received toggleRoundReady from client ${client.id} UserID ${client.data.user.name}`,
		);
		await this.gameService.toggleRoundReady(data.roomId, client.data.user);
	}

	@SubscribeMessage("joinGame")
	async joinGame(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: JoinGameDto,
	) {
		this.logger.log(
			`Received joinGame from client ${client.id} UserID ${client.data.user.name}`,
		);
		const room = await this.gameService.joinGame(dto, client.data.user);
		await client.join(dto.roomId);
		const publicState = plainToInstance(GameResponseDetailsDto, room, {
			excludeExtraneousValues: true,
		});

		client.emit("gameUpdated", publicState);

		const privateState = await this.gameService.getPrivatePlayerState(
			dto.roomId,
			client.data.user.id,
		);

		if (privateState?.word) {
			client.emit(
				"privateWord",
				plainToInstance(WordResponseDto, privateState.word, {
					excludeExtraneousValues: true,
				}),
			);

			this.logger.log(
				`Resent private word to guesser ${client.data.user.name}`,
			);
		}

		return publicState;
	}
	@SubscribeMessage("kickPlayer")
	async kickPlayer(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: KickPlayerDto,
	) {
		await this.gameService.kickPlayer(dto, client.data.user);
	}
	@SubscribeMessage("startGame")
	async startGame(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: { roomId: string },
	) {
		await this.gameService.startGame(dto.roomId, client.data.user);
	}
	@SubscribeMessage("updateGameSettings")
	async updateGameSettings(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: UpdateGameSettingsDto,
	) {
		await this.gameService.updateGameSettings(dto, client.data.user);
	}
	@SubscribeMessage("createTeam")
	async createTeam(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: CreateTeamDto,
	) {
		await this.gameService.createTeam(dto, client.data.user);
	}
	@SubscribeMessage("moveToTeam")
	async moveToTeam(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: MoveToTeamDto,
	) {
		await this.gameService.moveToTeam(dto, client.data.user);
	}
	@SubscribeMessage("deleteTeam")
	async deleteTeam(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: DeleteTeamDto,
	) {
		await this.gameService.deleteTeam(dto, client.data.user);
	}
	@SubscribeMessage("leaveGame")
	async leaveGame(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() body: PlayerLeaveRoomBodyDto,
	) {
		this.logger.log(
			`Received leaveGame from client ${client.id} UserID ${client.data.user.name}`,
		);
		await this.gameService.playerLeftRoom({
			playerId: client.data.user.id,
			roomId: body.roomId,
		});
		return { success: true };
	}

	@SubscribeMessage("nextWord")
	async nextWord(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: NextWordDto,
	) {
		const data = await this.gameService.nextWord(dto, client.data.user);
		return plainToInstance(WordResponseDto, data.newWord, {
			excludeExtraneousValues: true,
		});
	}
	@SubscribeMessage("nextRound")
	async nextRound(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: NextRoundDto,
	) {
		await this.gameService.nextRound(dto, client.data.user);
	}
	@SubscribeMessage("startRound")
	async startRound(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: StartRoundDto,
	) {
		const data = await this.gameService.startRound(dto, client.data.user);
		return plainToInstance(WordResponseDto, data.word, {
			excludeExtraneousValues: true,
		});
	}

	@SubscribeMessage("changeWordScore")
	async changeWordScore(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: ChangeWordScoreDto,
	) {
		await this.gameService.changeWordScore(dto, client.data.user);
	}
	@SubscribeMessage("deleteGame")
	async deleteGame(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: DeleteGameDto,
	) {
		await this.gameService.deleteGame(dto, client.data.user);
	}

	@OnEvent(PLAYER_KICKED)
	handlePlayerKicked(payload: PlayerKickedPayload) {
		this.server
			.to(payload.roomId)
			.emit("playerKicked", { kickedUserId: payload.kickedUserId });
	}
	@OnEvent(GAME_STARTED)
	handleGameStarted(payload: GameStartedPayload) {
		this.server.to(payload.room.id).emit(
			"gameStarted",
			plainToInstance(GameResponseDetailsDto, payload.room, {
				excludeExtraneousValues: true,
			}),
		);
	}
	@OnEvent(TEAMS_UPDATED)
	handleTeamUpdated(payload: TeamsUpdatedPayload) {
		this.server.to(payload.roomId).emit(
			"teamsUpdated",
			plainToInstance(TeamResponseDto, payload.teams, {
				excludeExtraneousValues: true,
			}),
		);
	}

	@OnEvent(GAME_UPDATED)
	handleGameUpdate(payload: GameUpdatedPayload) {
		this.server.to(payload.room.id).emit(
			"gameUpdated",
			plainToInstance(GameResponseDetailsDto, payload.room, {
				excludeExtraneousValues: true,
			}),
		);
	}
	@OnEvent(PLAYERS_UPDATED)
	handlePlayerReadyUpdate(payload: PlayersUpdatedPayload) {
		this.server.to(payload.roomId).emit(
			"playersUpdated",
			plainToInstance(PlayerResponseDto, payload.players, {
				excludeExtraneousValues: true,
			}),
		);
	}
	@OnEvent(ROUND_UPDATED)
	handleRoundUpdated(payload: RoundUpdatedPayload) {
		this.server.to(payload.roomId).emit(
			"roundUpdated",
			plainToInstance(RoundResponseDto, payload.round, {
				excludeExtraneousValues: true,
			}),
		);
	}
	@OnEvent(GAME_FINISHED)
	handleGameFinished(payload: GameFinishedPayload) {
		this.server.to(payload.room.id).emit("gameFinished");
	}
	async handleDisconnect(client: AuthenticatedSocket) {
		this.logger.log(
			`Received disconnet from client ${client.id} UserID ${client.data.user.name}`,
		);
		const { roomId } = await this.gameService.getGameIdByUserId(
			client.data.user.id,
		);
		if (!roomId) return;
		await this.gameService.setPlayerOffline(roomId, client.data.user.id);
		await this.removePlayerFromRoom(roomId, client.data.user.id);
	}

	private async removePlayerFromRoom(roomId: string, playerId: string) {
		const sockets = await this.server.in(roomId).fetchSockets();
		const targetSocket = sockets.find(
			(socket) =>
				(socket as unknown as AuthenticatedSocket).data.user.id ===
				playerId,
		);
		if (targetSocket) {
			targetSocket.leave(playerId);
		}
	}
}
