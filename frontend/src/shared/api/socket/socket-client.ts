import { io } from "socket.io-client";
import { WS_URL } from "../urls";
import { toast } from "sonner";

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

