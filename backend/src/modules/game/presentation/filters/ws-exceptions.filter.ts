import {
	Catch,
	type ArgumentsHost,
	type WsExceptionFilter,
	HttpException,
	Logger,
} from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import type { Socket } from "socket.io";

@Catch()
export class WsExceptionsFilter implements WsExceptionFilter {
	private readonly logger = new Logger(WsExceptionsFilter.name);

	catch(exception: unknown, host: ArgumentsHost): void {
		const client = host.switchToWs().getClient<Socket>();
		this.logException(exception);

		const { errorName, errorMessage } = this.resolveErrorInfo(exception);
		const { code, details } = this.extractDetails(exception);

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

	private logException(exception: unknown): void {
		if (exception instanceof Error) {
			this.logger.error(
				`WS Exception: ${exception.message}`,
				exception.stack,
			);
		} else {
			this.logger.error(`WS Exception: ${JSON.stringify(exception)}`);
		}
	}

	private resolveErrorInfo(exception: unknown): {
		errorName: string;
		errorMessage: string;
	} {
		if (exception instanceof HttpException) {
			return {
				errorName: exception.name,
				errorMessage: this.extractHttpMessage(exception),
			};
		}

		if (exception instanceof WsException) {
			return {
				errorName: "WsException",
				errorMessage: this.extractWsMessage(exception),
			};
		}

		if (exception instanceof Error) {
			return {
				errorName: exception.name || "Error",
				errorMessage: exception.message,
			};
		}

		return {
			errorName: "InternalServerError",
			errorMessage: "Internal server error",
		};
	}

	private extractHttpMessage(exception: HttpException): string {
		const response = exception.getResponse();
		if (typeof response === "string") {
			return response;
		}
		if (response && typeof response === "object") {
			const msg = (response as Record<string, unknown>).message;
			if (Array.isArray(msg)) {
				return msg.join(", ");
			}
			if (typeof msg === "string") {
				return msg;
			}
		}
		return exception.message;
	}

	private extractWsMessage(exception: WsException): string {
		const err = exception.getError();
		if (typeof err === "string") {
			return err;
		}
		if (err && typeof err === "object") {
			const msg = (err as Record<string, unknown>).message;
			if (typeof msg === "string") {
				return msg;
			}
			return JSON.stringify(err);
		}
		return exception.message;
	}

	private extractDetails(exception: unknown): {
		code: string;
		details: Record<string, unknown>;
	} {
		let code = "INTERNAL_ERROR";
		const details: Record<string, unknown> = {};

		if (exception && typeof exception === "object") {
			const errObj = exception as Record<string, unknown>;
			if (typeof errObj.code === "string") {
				code = errObj.code;
			}
			if (errObj.details && typeof errObj.details === "object") {
				Object.assign(details, errObj.details);
			}
			for (const key of [
				"teamId",
				"teamName",
				"playerId",
				"roomId",
				"wordId",
			]) {
				if (typeof errObj[key] === "string" && !details[key]) {
					details[key] = errObj[key];
				}
			}
		}

		return { code, details };
	}
}
