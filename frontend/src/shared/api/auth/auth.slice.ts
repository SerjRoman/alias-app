import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthStore, User } from "./auth.types";

export const useAuth = create<AuthStore>()(
	persist(
		(set) => ({
			token: null,
			refreshToken: null,
			user: null,
			hasHydrated: false,
			setToken: (token: string | null) => set(() => ({ token })),
			setRefreshToken: (refreshToken: string | null) =>
				set(() => ({ refreshToken })),
			setUser: (user: User | null) => set(() => ({ user })),
			setAuth: ({ token, refreshToken = null, user }) =>
				set(() => ({ token, refreshToken, user })),
			logout: () =>
				set(() => ({ token: null, refreshToken: null, user: null })),
			setHasHydrated: (hasHydrated: boolean) =>
				set(() => ({ hasHydrated })),
		}),
		{
			name: "auth-token",
			partialize: (state) => ({
				token: state.token,
				refreshToken: state.refreshToken,
				user: state.user,
			}),
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true);
			},
		},
	),
);
