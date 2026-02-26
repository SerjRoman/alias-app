import { socketClient } from "@shared/api/socket";

export const readyApi = {
	toggleGameReady: (roomId: string) => {
		socketClient.emit("toggleGameReady", { roomId });
	},
	toggleRoundReady: (roomId: string) => {
		socketClient.emit("toggleRoundReady", { roomId });
	},
};
