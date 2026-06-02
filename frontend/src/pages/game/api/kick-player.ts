import { socketClient } from "@shared/api";

export function kickPlayer(roomId: string, playerId: string, permanently: boolean = false) {
	socketClient.emit("admin:kickPlayer", {
		roomId,
		playerId,
		permanently,
	});
}
