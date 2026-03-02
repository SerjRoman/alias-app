import type { WordState } from "@entities/game";
import { socketClient } from "@shared/api";

export const nextWord = (
    roomId: string,
    wasSkipped: boolean,
    callback: (word: WordState) => void,
) => {
    socketClient.emit("nextWord", { roomId, wasSkipped }, callback);
};
