import type { WordState } from "@entities/game";
import { socketClient } from "@shared/api";

export const startRound = (
    roomId: string,
    callback: (word: WordState) => void,
) => {
    socketClient.emit("startRound", { roomId }, callback);
};
