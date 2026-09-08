import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./v1";
import { API_URL } from "./urls";
import { useAuth } from "./auth";

export const client = createFetchClient<paths>({
	baseUrl: API_URL,
	headers: {
		"ngrok-skip-browser-warning": "true",
	},
});

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export async function refreshAccessToken(): Promise<boolean> {
	const { refreshToken, user, setAuth, logout } = useAuth.getState();
	if (!refreshToken || user?.role !== "registered") {
		return false;
	}

	if (isRefreshing && refreshPromise) {
		return refreshPromise;
	}

	isRefreshing = true;
	refreshPromise = (async () => {
		try {
			const res = await fetch(`${API_URL}/user/refresh`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"ngrok-skip-browser-warning": "true",
				},
				body: JSON.stringify({ refreshToken }),
			});

			if (!res.ok) {
				logout();
				return false;
			}

			const data = (await res.json()) as {
				accessToken: string;
				refreshToken?: string;
				user: { id: string; name: string; role: "registered" };
			};

			setAuth({
				token: data.accessToken,
				refreshToken: data.refreshToken ?? refreshToken,
				user: data.user,
			});
			return true;
		} catch (err) {
			console.error("Token refresh failed:", err);
			logout();
			return false;
		} finally {
			isRefreshing = false;
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

client.use({
	onRequest({ request }) {
		const token = useAuth.getState().token;
		if (token) {
			request.headers.set("Authorization", `Bearer ${token}`);
		}
		return request;
	},
	async onResponse({ response, request }) {
		if (response.status === 401 && !request.url.includes("/user/refresh")) {
			const { refreshToken, user } = useAuth.getState();
			if (refreshToken && user?.role === "registered") {
				const refreshed = await refreshAccessToken();
				if (refreshed) {
					const newToken = useAuth.getState().token;
					if (newToken) {
						request.headers.set(
							"Authorization",
							`Bearer ${newToken}`,
						);
					}
					return fetch(request);
				}
			}
		}
		return response;
	},
});

export const { useMutation, useQuery, queryOptions } = createClient(client);
