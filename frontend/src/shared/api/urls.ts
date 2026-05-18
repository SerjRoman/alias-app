export const API_URL = import.meta.env.DEV
	? "http://localhost:3000"
	: import.meta.env.VITE_API_URL;
export const WS_URL = import.meta.env.DEV
	? "http://localhost:3000/game-ws"
	: import.meta.env.VITE_WS_URL;
