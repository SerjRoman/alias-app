import type { UserRole } from "./authenticated-user";

export interface JwtPayload {
	sub: string;
	name: string;
	role: UserRole;
}
