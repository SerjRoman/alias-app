export type ApiErrorStatus = number;

export type ErrorMessagesMap = {
	[key in ApiErrorStatus]?: string;
} & {
	fallback?: string;
};

/**
 * Helper to extract error message from API response error.
 * It uses the provided mapping or falls back to a default message.
 *
 * @param error - The error object from openapi-fetch (usually { status, data: { message, error, statusCode } })
 * @param messagesMap - Map of custom error messages based on status code
 * @returns Formatted error string to display to the user
 */
export function getApiError(
	error: unknown,
	messagesMap?: ErrorMessagesMap,
): string {
	if (!error) return messagesMap?.fallback || "An unknown error occurred";

	// Type cast error to access its properties safely
	const err = error as {
		status?: number;
		data?: { message?: string | string[]; error?: string };
		message?: string;
	};

	// If error is an openapi-fetch error object
	const status = err.status;

	if (status && messagesMap?.[status]) {
		return messagesMap[status];
	}

	// Try to get message from API standard error response structure { message: string | string[] }
	if (err.data?.message) {
		const message = err.data.message;
		return Array.isArray(message) ? message.join(", ") : message;
	}

	if (err.data?.error) {
		return err.data.error;
	}

	// Fallback to error object message or map fallback
	return (
		messagesMap?.fallback || err.message || "An unexpected error occurred"
	);
}
