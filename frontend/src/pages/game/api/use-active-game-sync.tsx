import { useGameSlice, type WordState } from "@entities/game";
import { socketClient } from "@shared/api";
import { useEffect } from "react";

export function useActiveGameSync() {
	const { setCurrentWord } = useGameSlice();
	useEffect(() => {
		function handlePrivateWord(word: WordState) {
			setCurrentWord(word);
		}
		socketClient.on("privateWord", handlePrivateWord);

		return () => {
			socketClient.off("privateWord", handlePrivateWord);
		};
	}, [setCurrentWord]);
}
