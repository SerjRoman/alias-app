import { socketClient } from "@shared/api";

export function changeWordScore(roomId: string, wordId: string, delta: number) {
    socketClient.emit("changeWordScore", { roomId, wordId, delta });
}

