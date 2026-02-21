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
} from "../events/game.events";
import { plainToInstance } from "class-transformer";
import { GameResponseDetailsDto } from "./dto/response";
import { PlayerResponseDto } from "./dto/response/player.dto";
import type { GameServer, GameSocket } from "./game.socket-types";
import {
	CreateTeamDto,
	DeleteTeamDto,
	JoinGameDto,
	KickPlayerDto,
	MoveToTeamDto,
	PlayerLeaveRoomBodyDto,
	UpdateGameSettingsDto,
} from "./dto/body";
import { TeamStateDto } from "./dto/team.dto";
import { GameWsExceptionFilter } from "../filters/game-exception.filter";
import { TeamWsExceptionFilter } from "../filters/team-exception.filter";
import { AuthenticatedSocket } from "../../../common/types/socket";

@WebSocketGateway({
	cors: {
		origin: "*",
	},
	namespace: "game-ws",
})
@UseFilters(new GameWsExceptionFilter(), new TeamWsExceptionFilter())
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

	@SubscribeMessage("joinGame")
	async join(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: JoinGameDto,
	) {
		this.logger.log(
			`Received joinGame from client ${client.id} UserID ${client.data.user.name}`,
		);
		const room = await this.gameService.joinGame(dto, client.data.user);
		await client.join(dto.roomId);
		return plainToInstance(GameResponseDetailsDto, room, {
			excludeExtraneousValues: true,
		});
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
		console.log(body);
		await this.gameService.playerLeftRoom({
			playerId: client.data.user.id,
			roomId: body.roomId,
		});
	}

	@OnEvent(PLAYER_KICKED)
	async handlePlayerKicked(payload: PlayerKickedPayload) {
		const sockets = await this.server.in(payload.roomId).fetchSockets();
		const targetSocket = sockets.find(
			(socket) =>
				(socket as unknown as GameSocket).data.user.id ===
				payload.kickedUserId,
		);
		if (targetSocket) {
			targetSocket.leave(payload.roomId);
		}

		this.server.to(payload.roomId).emit("playerKicked", payload.players);
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
			plainToInstance(TeamStateDto, payload.teams, {
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
	async handleDisconnect(client: AuthenticatedSocket) {
		this.logger.log(
			`Received disconnet from client ${client.id} UserID ${client.data.user.name}`,
		);
		const { roomId } = await this.gameService.getCurrentGameId(
			client.data.user.id,
		);
		if (!roomId) return;
		await this.gameService.playerLeftRoom({
			roomId: roomId,
			playerId: client.data.user.id,
		});
		await this.disconnectSocketFromRoom(roomId, client);
	}

	private async disconnectSocketFromRoom(
		roomId: string,
		client: AuthenticatedSocket,
	) {
		const sockets = await this.server.in(roomId).fetchSockets();
		const targetSocket = sockets.find(
			(socket) =>
				(socket as unknown as AuthenticatedSocket).data.user.id ===
				client.data.user.id,
		);
		if (targetSocket) {
			targetSocket.leave(client.data.user.id);
		}
	}
}
