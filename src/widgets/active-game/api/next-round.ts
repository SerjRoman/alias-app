import { socketClient } from "@shared/api/socket";

export function nextRound(roomId: string) {
    socketClient.emit("nextRound", { roomId });
}