import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
	OnGatewayConnection,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { AuthenticatedSocket } from "@common/types/socket";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "@common/types/jwt-payload";

@WebSocketGateway({
	cors: {
		origin: "*",
	},
	namespace: "game-ws",
})
export class UserGateway implements OnGatewayConnection {
	private readonly logger: Logger = new Logger(UserGateway.name);
	@WebSocketServer() server: Server;
	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	async handleConnection(client: AuthenticatedSocket) {
		this.logger.log(`Client ${client.id} connected`);
		const token = this.extractTokenFromHandshake(client);
		if (!token) {
			this.logger.warn(
				`Client ${client.id} disconnected: No token provided`,
			);
			client.disconnect();
			return;
		}
		try {
			const payload: JwtPayload = await this.jwtService.verifyAsync(
				token,
				{
					secret: this.configService.getOrThrow("JWT_SECRET_KEY"),
                    ignoreExpiration: true
				},
			);
			client.data.user = {
				id: payload.sub,
				name: payload.name,
				role: payload.role,
			};
		} catch (error) {
			this.logger.error(
				`Client ${client.id} disconnected: Invalid token.`,
			);
			this.logger.error(error);
			client.disconnect();
		}
	}
	private extractTokenFromHandshake(client: Socket): string | null {
		const auth = client.handshake.auth.token;
		if (typeof auth !== "string") {
			const [headerType, headerToken] =
				client.handshake.headers.authorization?.split(" ") ?? [];
			if (headerType === "Bearer") return headerToken;
			return null;
		}
		const [type, token] = auth.split(" ");
		if (type === "Bearer") return token;

		return null;
	}
}
