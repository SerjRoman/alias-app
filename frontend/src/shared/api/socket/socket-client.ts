import { io } from "socket.io-client";
import { WS_URL } from "../urls";

export const socketClient = io(WS_URL, {
	autoConnect: false,
	extraHeaders: {
		"ngrok-skip-browser-warning": "true",
	},
});
