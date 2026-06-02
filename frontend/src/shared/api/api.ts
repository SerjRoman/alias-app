import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./v1";
import { API_URL } from "./urls";

export const client = createFetchClient<paths>({
	baseUrl: API_URL,
});

let getTokenProvider: () => string | null = () => null;
let refreshAuthToken: () => Promise<void> | null = () => null;

export const setAuthTokenProvider = (provider: () => string | null) => {
	getTokenProvider = provider;
};
export const setRefreshTokenProvider = (
	provider: () => Promise<void> | null,
) => {
	refreshAuthToken = provider;
};

client.use({
	onRequest({ request }) {
		const token = getTokenProvider();
		if (token) {
			request.headers.set("Authorization", `Bearer ${token}`);
		}
		return request;
	},
	onError: async ({ error }) => {
		console.error("API Error:", error);
		if (error instanceof Error) {
			if (error.name === "TokenExpiredError") {
				await refreshAuthToken();
			}
		}
	},
});

export const { useMutation, useQuery, queryOptions } = createClient(client);
