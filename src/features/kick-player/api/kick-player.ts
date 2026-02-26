import { socketClient } from "../../../shared/api/socket";

export function kickPlayer(roomId: string, playerId: string) {
	socketClient.emit("kickPlayer", {
		roomId,
		playerId,
	});
}
