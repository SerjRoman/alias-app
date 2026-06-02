import {
	MutationCache,
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import "./App.css";
import { AppRoutes } from "./app-routes";
import { setAuthTokenProvider, setRefreshTokenProvider } from "@shared/api";
import { useAuth } from "@entities/auth";

setAuthTokenProvider(() => useAuth.getState().token);
setRefreshTokenProvider(async () => {
	useAuth.setState({ token: null, user: null });
});

export function App() {
	const { t } = useTranslation();

	const queryClient = useMemo(() => {
		const handleGlobalError = (error: unknown) => {
			const err = error as { status?: number };
			if (err?.status && err.status >= 500) {
				toast.error(t("api.errors.internal"));
			}
		};

		return new QueryClient({
			queryCache: new QueryCache({
				onError: handleGlobalError,
			}),
			mutationCache: new MutationCache({
				onError: handleGlobalError,
			}),
		});
	}, [t]);

	return (
		<QueryClientProvider client={queryClient}>
			<AppRoutes />
			<Toaster position="bottom-right" richColors />
		</QueryClientProvider>
	);
}
