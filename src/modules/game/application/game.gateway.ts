import { Logger } from "@nestjs/common";
import type { AuthenticatedSocket } from "../../../common/types/authenticated-socket";
import { GameService } from "./game.service";
import {
	ConnectedSocket,
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "socket.io";

@WebSocketGateway({
	cors: {
		origin: "*",
	},
	namespace: "ws",
})
export class GameGateway {
	@WebSocketServer() server: Server;

	private readonly logger = new Logger(GameGateway.name);
	constructor(private readonly gameService: GameService) {}
	@SubscribeMessage("toggleGameReady")
	async toggleGameReady(
		@ConnectedSocket() client: AuthenticatedSocket,
		@MessageBody() data: { roomId: string },
	) {
		this.logger.log(
			`Received toggleGameReady from client ${client.id} UserID ${client.data.user.name}`,
		);
		const room = await this.gameService.toggleReady(
			data.roomId,
			client.data.user,
		);
		this.server.emit("gameReadyToggled", {
			user: client.data.user,
			room,
		});
	}
}
