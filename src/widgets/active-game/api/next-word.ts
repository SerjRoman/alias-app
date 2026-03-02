import type { WordState } from "@entities/game/model";
import { socketClient } from "@shared/api/socket";

export const nextWord = (
	roomId: string,
	wasSkipped: boolean,
	callback: (word: WordState) => void,
) => {
	socketClient.emit("nextWord", { roomId, wasSkipped }, callback);
};
