import type { Socket } from "socket.io";
import type { UserFromToken } from "./user-from-token";

export type AuthenticatedSocket = Socket<
	object,
	object,
	object,
	{
		user: UserFromToken;
	}
>;
