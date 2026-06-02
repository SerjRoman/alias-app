import type { ErrorMessagesMap } from "@shared/api";

export const LOGIN_ERROR_MESSAGES: ErrorMessagesMap = {
	401: "login.errorInvalidCredentials",
	400: "api.errors.validation",
	fallback: "api.errors.fallback",
};

export const REGISTER_ERROR_MESSAGES: ErrorMessagesMap = {
	409: "register.errorEmailExists",
	400: "api.errors.validation",
	fallback: "api.errors.fallback",
};
