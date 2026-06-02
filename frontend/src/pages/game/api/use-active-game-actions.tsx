import { socketClient } from "@shared/api";
import { nextWord as nextWordApi } from "../api/next-word";
import { startRound as startRoundApi } from "../api/start-round";
import { changeWordScore as changeWordScoreApi } from "../api/change-word-score";
import { useGameSlice, type WordState } from "@entities/game";

export function useActiveGameActions() {
	const { setCurrentWord } = useGameSlice();
	const startRound = (roomId: string) => {
		startRoundApi(roomId, (word: WordState) => {
			setCurrentWord(word);
		});
	};
	const nextWord = (roomId: string, wasSkipped: boolean) => {
		nextWordApi(roomId, wasSkipped, (word: WordState) => {
			setCurrentWord(word);
		});
	};
	const changeWordScore = (roomId: string, wordId: string, delta: number) => {
		changeWordScoreApi(roomId, wordId, delta);
	};

	const nextRound = (roomId: string) => {
		socketClient.emit("nextRound", { roomId });
	};
	const endPointing = (roomId: string) => {
		socketClient.emit("endPointing", { roomId });
	};
	const finishRound = (roomId: string) => {
		socketClient.emit("finishRound", { roomId });
	};
	return {
		startRound,
		nextWord,
		nextRound,
		changeWordScore,
		endPointing,
		finishRound,
	};
}
