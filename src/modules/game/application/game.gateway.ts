import { Logger } from "@nestjs/common";
import type { AuthenticatedSocket } from "../../../common/types/socket";
import { GameService } from "./game.service";
import {
	ConnectedSocket,
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { OnEvent } from "@nestjs/event-emitter";
import {
	GAME_UPDATED,
	PLAYER_GAME_READY_UPDATE,
	type PlayerGameReadyPayload,
	type GameUpdatedPayload,
	PLAYER_ROUND_READY_UPDATE,
	type PlayerRoundReadyPayload,
	type PlayerKickedPayload,
	PLAYER_KICKED,
	GAME_STARTED,
	type GameStartedPayload,
	TEAMS_UPDATED,
	type TeamsUpdatedPayload,
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
	UpdateGameSettingsDto,
} from "./dto/body";
import { TeamStateDto } from "./dto/team.dto";

@WebSocketGateway({
	cors: {
		origin: "*",
	},
	namespace: "ws",
})
export class GameGateway {
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
		@ConnectedSocket() client: AuthenticatedSocket,
		@MessageBody() dto: JoinGameDto,
	) {
		this.logger.log(
			`Received toggleGameReady from client ${client.id} UserID ${client.data.user.name}`,
		);
		await this.gameService.joinGame(dto, client.data.user);
		await client.join(dto.roomId);
	}
	@SubscribeMessage("kickPlayer")
	async kickPlayer(
		@ConnectedSocket() client: GameSocket,
		@MessageBody() dto: KickPlayerDto,
	) {
		await this.gameService.kickPlayer(dto, client.data.user);
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

	@OnEvent(PLAYER_KICKED)
	async handlePlayerKicked(payload: PlayerKickedPayload) {
		const sockets = await this.server.in(payload.roomId).fetchSockets();
		const targetSocket = sockets.find(
			(socket) =>
				(socket as unknown as GameSocket).data.user.id ===
				payload.playerId,
		);
		if (targetSocket) {
			targetSocket.leave(payload.roomId);
		}

		this.server
			.to(payload.roomId)
			.emit("playerKicked", { playerId: payload.playerId });
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
			"teamUpdated",
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
	@OnEvent(PLAYER_GAME_READY_UPDATE)
	handlePlayerReadyUpdate(payload: PlayerGameReadyPayload) {
		this.server.to(payload.roomId).emit(
			"playerGameReadyUpdate",
			plainToInstance(PlayerResponseDto, payload.player, {
				excludeExtraneousValues: true,
			}),
		);
	}
	@OnEvent(PLAYER_ROUND_READY_UPDATE)
	handlePlayerRoundReadyUpdate(payload: PlayerRoundReadyPayload) {
		this.server.to(payload.roomId).emit(
			"playerGameRoundUpdate",
			plainToInstance(PlayerResponseDto, payload.player, {
				excludeExtraneousValues: true,
			}),
		);
	}
}
