import { Catch, ArgumentsHost, WsExceptionFilter } from "@nestjs/common";
import { Socket } from "socket.io";
import { TeamError } from "../../domain/errors/team.errors";

@Catch(TeamError)
export class TeamWsExceptionFilter implements WsExceptionFilter {
	catch(exception: TeamError, host: ArgumentsHost) {
		console.log(exception);
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
