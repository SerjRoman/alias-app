export type UserRole = "registered" | "anonymous";
export interface User {
	id: string;
	name: string;
	role: UserRole;
	username?: string;
	email?: string;
	avatarUrl?: string;
}
