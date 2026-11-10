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
				const msg = (response as Record<string, unknown>).message;
				errorMessage = Array.isArray(msg)
					? msg.join(", ")
					: typeof msg === "string"
						? msg
						: exception.message;
			} else {
				errorMessage = exception.message;
			}
		} else if (exception instanceof WsException) {
			errorName = "WsException";
			const err = exception.getError();
			if (typeof err === "string") {
				errorMessage = err;
			} else if (err && typeof err === "object") {
				const msg = (err as Record<string, unknown>).message;
				errorMessage =
					typeof msg === "string" ? msg : JSON.stringify(err);
			} else {
				errorMessage = exception.message;
			}
		} else if (exception instanceof Error) {
			errorName = exception.name || "Error";
			errorMessage = exception.message;
		}

		let code = "INTERNAL_ERROR";
		const details: Record<string, unknown> = {};

		if (exception && typeof exception === "object") {
			if (
				"code" in exception &&
				typeof (exception as { code: unknown }).code === "string"
			) {
				code = (exception as { code: string }).code;
			}
			if (
				"details" in exception &&
				typeof (exception as { details: unknown }).details ===
					"object" &&
				(exception as { details: unknown }).details !== null
			) {
				Object.assign(
					details,
					(exception as { details: Record<string, unknown> }).details,
				);
			}
			for (const key of [
				"teamId",
				"teamName",
				"playerId",
				"roomId",
				"wordId",
			]) {
				if (
					key in exception &&
					typeof (exception as Record<string, unknown>)[key] ===
						"string" &&
					!details[key]
				) {
					details[key] = (exception as Record<string, unknown>)[key];
				}
			}
		}

		const errorResponse = {
			event: "exception",
			data: {
				code,
				name: errorName,
				message: errorMessage,
				details,
			},
		};

		if (client && typeof client.emit === "function") {
			client.emit("exception", errorResponse);
		}
	}
}
