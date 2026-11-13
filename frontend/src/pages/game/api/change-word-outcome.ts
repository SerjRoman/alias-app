import type { WordOutcome } from "@entities/game";
import { socketClient } from "@shared/api";

export function changeWordOutcome(
	roomId: string,
	wordId: string,
	outcome: WordOutcome,
) {
	socketClient.emit("changeWordOutcome", { roomId, wordId, outcome });
}
