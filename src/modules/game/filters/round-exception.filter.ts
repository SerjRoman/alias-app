import { Catch, ArgumentsHost, WsExceptionFilter } from "@nestjs/common";
import { RoundError } from "../domain/errors/round.errors";
import { Socket } from "socket.io";

@Catch(RoundError)
export class RoundWsExceptionFilter implements WsExceptionFilter {
	catch(exception: RoundError, host: ArgumentsHost) {
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
