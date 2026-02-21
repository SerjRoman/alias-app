import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "./auth.types";

interface AuthStore {
	token: string | null;
	user: User | null;
	setToken: (token: string | null) => void;
	setUser: (user: User | null) => void;
}

export const useAuth = create<AuthStore>()(
	persist(
		(set) => ({
			token: null,
			user: null,
			setToken: (token: string | null) => set(() => ({ token })),
			setUser: (user: User | null) => set(() => ({ user })),
		}),
		{
			name: "auth-token",
		},
	),
);
