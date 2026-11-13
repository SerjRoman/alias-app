import {
	Catch,
	ArgumentsHost,
	ExceptionFilter,
	HttpStatus,
} from "@nestjs/common";
import {
	GameError,
	NotRoomOwnerOnlyDuringGameError,
	PlayerNotRoomOwnerError,
	PlayerPermanentlyKickedError,
	RoomNotFoundError,
} from "../../domain/errors/game.errors";
import { RoundError } from "../../domain/errors/round.errors";
import { TeamError } from "../../domain/errors/team.errors";
import { Request, Response } from "express";

@Catch(GameError, RoundError, TeamError)
export class GameHttpExceptionFilter implements ExceptionFilter {
	catch(exception: GameError | RoundError | TeamError, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response: Response = ctx.getResponse();
		const request: Request = ctx.getRequest();

		let statusCode = HttpStatus.BAD_REQUEST;
		if (exception instanceof RoomNotFoundError) {
			statusCode = HttpStatus.NOT_FOUND;
		} else if (
			exception instanceof PlayerNotRoomOwnerError ||
			exception instanceof PlayerPermanentlyKickedError ||
			exception instanceof NotRoomOwnerOnlyDuringGameError
		) {
			statusCode = HttpStatus.FORBIDDEN;
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
			const errObj = exception as unknown as Record<string, unknown>;
			for (const key of [
				"teamId",
				"teamName",
				"playerId",
				"roomId",
				"wordId",
			]) {
				if (
					key in exception &&
					typeof errObj[key] === "string" &&
					!details[key]
				) {
					details[key] = errObj[key];
				}
			}
		}

		response.status(statusCode).json({
			statusCode,
			timestamp: new Date().toISOString(),
			path: request.url,
			code,
			name: exception.name,
			message: exception.message,
			details,
		});
	}
}
