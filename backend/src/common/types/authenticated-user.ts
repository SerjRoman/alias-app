export type UserRole = "anonymous" | "registered";

interface BaseUser {
	id: string;
	name: string;
}

export interface AnonymousUser extends BaseUser {
	role: "anonymous";
}

export interface RegisteredUser extends BaseUser {
	role: "registered";
}

export type AuthenticatedUser = AnonymousUser | RegisteredUser;
