import { io } from "socket.io-client";
import { WS_URL } from "../urls";
import { toast } from "sonner";

import i18n from "../../config/i18n/i18n";

export const socketClient = io(WS_URL, {
	autoConnect: false,
	extraHeaders: {
		"ngrok-skip-browser-warning": "true",
	},
});

interface WsExceptionData {
	event?: string;
	data?: {
		name?: string;
		message?: string;
	};
	message?: string;
}

socketClient.on("exception", (error: unknown) => {
	console.error("WS Exception encountered:", error);
	const err = error as WsExceptionData;
	const message = err?.data?.message || err?.message || "WebSocket Error";
	toast.error(message);
});

let wasDisconnected = false;

socketClient.on("disconnect", (reason) => {
	console.warn("Socket disconnected:", reason);
	if (reason !== "io client disconnect" && reason !== "io server disconnect") {
		wasDisconnected = true;
		toast.error(i18n.t("common.connectionLost", "Connection lost. Reconnecting..."), {
			id: "socket-disconnect",
			duration: Infinity,
		});
	}
});

socketClient.on("connect", () => {
	console.log("Socket connected");
	toast.dismiss("socket-disconnect");
	if (wasDisconnected) {
		wasDisconnected = false;
		toast.success(i18n.t("common.connectionRestored", "Connection restored!"), {
			id: "socket-connect",
			duration: 3000,
		});
	}
});

