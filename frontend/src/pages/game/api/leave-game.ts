import { socketClient } from "@shared/api";

export function leaveGame(roomId: string) {
	socketClient.emit("leaveGame", {
		roomId,
	});
}
