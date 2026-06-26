import {
	Catch,
	ArgumentsHost,
	WsExceptionFilter,
	HttpException,
	Logger,
} from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

@Catch()
export class WsExceptionsFilter implements WsExceptionFilter {
	private readonly logger = new Logger(WsExceptionsFilter.name);

	catch(exception: any, host: ArgumentsHost) {
		const client = host.switchToWs().getClient<Socket>();

		if (exception instanceof Error) {
			this.logger.error(
				`WS Exception: ${exception.message}`,
				exception.stack,
			);
		} else {
			this.logger.error(`WS Exception: ${JSON.stringify(exception)}`);
		}

		let errorName = "InternalServerError";
		let errorMessage = "Internal server error";

		if (exception instanceof HttpException) {
			const response = exception.getResponse();
			errorName = exception.name;
			if (typeof response === "string") {
				errorMessage = response;
			} else if (response && typeof response === "object") {
				const msg = (response as any).message;
				errorMessage = Array.isArray(msg)
					? msg.join(", ")
					: msg || exception.message;
			} else {
				errorMessage = exception.message;
			}
		} else if (exception instanceof WsException) {
			errorName = "WsException";
			const err = exception.getError();
			if (typeof err === "string") {
				errorMessage = err;
			} else if (err && typeof err === "object") {
				errorMessage = (err as any).message || JSON.stringify(err);
			} else {
				errorMessage = exception.message;
			}
		} else if (exception instanceof Error) {
			errorName = exception.name || "Error";
			errorMessage = exception.message;
		}

		const errorResponse = {
			event: "exception",
			data: {
				name: errorName,
				message: errorMessage,
			},
		};

		if (client && typeof client.emit === "function") {
			client.emit("exception", errorResponse);
		}
	}
}
