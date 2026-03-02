import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./v1";

const client = createFetchClient<paths>({
	baseUrl: import.meta.env.VITE_API_URL,
});

export const { useMutation, useQuery, queryOptions } = createClient(client);
