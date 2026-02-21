import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./App.css";
import { AppRoutes } from "./app-routes";

const queryClient = new QueryClient();

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<AppRoutes />
		</QueryClientProvider>
	);
}
