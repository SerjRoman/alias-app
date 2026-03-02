import { socketClient } from "@shared/api";

export function nextRound(roomId: string) {
    socketClient.emit("nextRound", { roomId });
}