import { Catch, ArgumentsHost, WsExceptionFilter } from "@nestjs/common";
import { Socket } from "socket.io";
import { GameError } from "../../domain/errors/game.errors";

@Catch(GameError)
export class GameWsExceptionFilter implements WsExceptionFilter {
	catch(exception: GameError, host: ArgumentsHost) {
		const client = host.switchToWs().getClient<Socket>();

		const errorResponse = {
			event: "exception",
			data: {
				name: exception.name,
				message: exception.message,
			},
		};

		client.emit("exception", errorResponse);
	}
}
