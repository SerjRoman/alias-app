import type { Socket } from "socket.io";
import type { AuthenticatedUser } from "./authenticated-user";

export type AuthenticatedSocket = Socket<
	object,
	object,
	object,
	{
		user: AuthenticatedUser;
	}
>;
