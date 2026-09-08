export interface User {
	id: string;
	name: string;
	username?: string;
	avatarUrl?: string;
	role: "anonymous" | "registered";
}

export interface AuthStore {
	token: string | null;
	refreshToken: string | null;
	user: User | null;
	hasHydrated: boolean;
	setToken: (token: string | null) => void;
	setRefreshToken: (refreshToken: string | null) => void;
	setUser: (user: User | null) => void;
	setAuth: (data: {
		token: string | null;
		refreshToken?: string | null;
		user: User | null;
	}) => void;
	logout: () => void;
	setHasHydrated: (hasHydrated: boolean) => void;
}
