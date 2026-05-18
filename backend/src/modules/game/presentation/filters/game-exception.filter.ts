import {
	Catch,
	ArgumentsHost,
	WsExceptionFilter,
	ExceptionFilter,
	HttpStatus,
} from "@nestjs/common";
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

@Catch(GameError)
export class GameHttpExceptionFilter implements ExceptionFilter {
	catch(exception: GameError, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();
		const request = ctx.getRequest();

		response.status(HttpStatus.BAD_REQUEST).json({
			statusCode: HttpStatus.BAD_REQUEST,
			timestamp: new Date().toISOString(),
			path: request.url,
			name: exception.name,
			message: exception.message,
		});
	}
}
