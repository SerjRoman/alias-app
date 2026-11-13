import {
	useGameSlice,
	usePrivatePlayerSlice,
	RoundStatus,
	type PrivatePlayerState,
	type WordState,
} from "@entities/game";
import { socketClient, useAuth } from "@shared/api";
import { useEffect } from "react";

export function useActiveGameSync() {
	const setCurrentWord = useGameSlice((state) => state.setCurrentWord);
	const roomId = useGameSlice((state) => state.game?.id);
	const roundStatus = useGameSlice(
		(state) => state.game?.currentRound?.status,
	);
	const explainerId = useGameSlice(
		(state) => state.game?.currentRound?.explainerId,
	);
	const hasCurrentWord = useGameSlice((state) => Boolean(state.currentWord));
	const setPlayerState = usePrivatePlayerSlice(
		(state) => state.setPlayerState,
	);
	const { user } = useAuth();

	useEffect(() => {
		function handleWord(word: WordState) {
			setCurrentWord(word);
		}
		function handlePrivateState(state: PrivatePlayerState) {
			setPlayerState(state);
		}

		socketClient.on("explainerWord", handleWord);
		socketClient.on("privateStateUpdated", handlePrivateState);

		return () => {
			socketClient.off("explainerWord", handleWord);
			socketClient.off("privateStateUpdated", handlePrivateState);
		};
	}, [setCurrentWord, setPlayerState]);

	useEffect(() => {
		if (!roomId) return;
		socketClient.emit(
			"getPrivateState",
			{ roomId },
			(state: PrivatePlayerState | null) => {
				if (state) {
					setPlayerState(state);
				}
			},
		);
	}, [roomId, setPlayerState]);

	useEffect(() => {
		if (
			!roomId ||
			!user ||
			roundStatus !== RoundStatus.IN_PROGRESS ||
			explainerId !== user.id ||
			hasCurrentWord
		) {
			return;
		}
		socketClient.emit(
			"getExplainerWord",
			{ roomId },
			(word: WordState | null) => {
				if (word) {
					setCurrentWord(word);
				}
			},
		);
	}, [roomId, user, roundStatus, explainerId, hasCurrentWord, setCurrentWord]);
}
