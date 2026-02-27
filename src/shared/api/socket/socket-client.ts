import { io } from "socket.io-client";

export const socketClient = io(import.meta.env.VITE_WS_URL, {
	autoConnect: false,
	extraHeaders: {
		"ngrok-skip-browser-warning": "true",
	},
});
