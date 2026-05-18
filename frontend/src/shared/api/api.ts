import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./v1";
import { API_URL } from "./urls";

const client = createFetchClient<paths>({
	baseUrl: API_URL,
});

export const { useMutation, useQuery, queryOptions } = createClient(client);
