import type { WordState } from "@entities/game/model";
import { socketClient } from "@shared/api/socket";

export const startRound = (
	roomId: string,
	callback: (word: WordState) => void,
) => {
	socketClient.emit("startRound", { roomId }, callback);
};
