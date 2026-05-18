import type { DefaultEventsMap, Socket } from "socket.io";
import type { AuthenticatedUser } from "./authenticated-user";

export type AuthenticatedSocket = Socket<
	DefaultEventsMap,
	DefaultEventsMap,
	object,
	{
		user: AuthenticatedUser;
	}
>;
