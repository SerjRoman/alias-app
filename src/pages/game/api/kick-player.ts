import { socketClient } from "@shared/api";

export function kickPlayer(roomId: string, playerId: string) {
	socketClient.emit("kickPlayer", {
		roomId,
		playerId,
	});
}
