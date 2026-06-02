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

	// Log the error to console for debugging
	console.error("API Error encountered:", error);

	const err = error as {
		status?: number;
		statusCode?: number;
		response?: { status?: number };
		data?: {
			statusCode?: number;
			message?: string | string[];
			error?: string;
		};
		message?: string;
		error?: string | string[];
	};

	// Extract status code from various potential structures
	const status =
		err.status ??
		err.statusCode ??
		err.data?.statusCode ??
		err.response?.status;

	if (status && messagesMap?.[status]) {
		return messagesMap[status];
	}

	// Try to get message from standard NestJS or OpenAPI fetch response structures
	const message =
		err.data?.message ?? err.message ?? err.data?.error ?? err.error;

	if (message) {
		return Array.isArray(message) ? message.join(", ") : message;
	}

	return messagesMap?.fallback || "An unexpected error occurred";
}

/**
 * Helper to extract and translate API response error using i18next translation function.
 * It encapsulates the type casting required for i18next key types in one place.
 *
 * @param t - The translate function from useTranslation()
 * @param error - The API error object
 * @param messagesMap - Map of custom error translation keys based on status code
 * @returns Translated error string
 */
import type { TFunction } from "i18next";

export function translateApiError(
	t: TFunction,
	error: unknown,
	messagesMap?: ErrorMessagesMap,
): string {
	const keyOrMessage = getApiError(error, messagesMap);
	const translate = t as unknown as (key: string) => string;
	return translate(keyOrMessage);
}
