import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "./auth.types";

interface AuthStore {
	token: string | null;
	user: User | null;
	hasHydrated: boolean;
	setToken: (token: string | null) => void;
	setUser: (user: User | null) => void;
	setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuth = create<AuthStore>()(
	persist(
		(set) => ({
			token: null,
			user: null,
			hasHydrated: false,
			setToken: (token: string | null) => set(() => ({ token })),
			setUser: (user: User | null) => set(() => ({ user })),
			setHasHydrated: (hasHydrated: boolean) =>
				set(() => ({ hasHydrated })),
		}),
		{
			name: "auth-token",
			partialize: (state) => ({ token: state.token, user: state.user }),
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true);
			},
		},
	),
);
