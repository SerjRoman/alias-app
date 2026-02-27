import { useGameSlice, type WordState } from "@entities/game/model";
import { socketClient } from "@shared/api/socket";

export function useActiveGameActions() {
	const { setCurrentWord } = useGameSlice();
	const startRound = (roomId: string) => {
		socketClient.emit("startRound", { roomId }, (word: WordState) => {
			console.log(word);
			setCurrentWord(word);
		});
	};
	const nextWord = (roomId: string, wasSkipped: boolean) => {
		socketClient.emit(
			"nextWord",
			{ roomId, wasSkipped },
			(word: WordState) => {
				console.log(word);
				setCurrentWord(word);
			},
		);
	};
	const nextRound = (roomId: string) => {
		socketClient.emit("nextWord", { roomId });
	};
	return { startRound, nextWord, nextRound };
}
