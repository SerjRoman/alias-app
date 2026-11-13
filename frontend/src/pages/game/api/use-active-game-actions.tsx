import { socketClient } from "@shared/api";
import { nextWord as nextWordApi } from "../api/next-word";
import { startRound as startRoundApi } from "../api/start-round";
import { changeWordOutcome as changeWordOutcomeApi } from "../api/change-word-outcome";
import {
	useGameSlice,
	usePrivatePlayerSlice,
	type EffectItemId,
	type PrivatePlayerState,
	type WordOutcome,
	type WordState,
} from "@entities/game";

export function useActiveGameActions() {
	const setCurrentWord = useGameSlice((state) => state.setCurrentWord);
	const setPlayerState = usePrivatePlayerSlice(
		(state) => state.setPlayerState,
	);
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
	const changeWordOutcome = (
		roomId: string,
		wordId: string,
		outcome: WordOutcome,
	) => {
		changeWordOutcomeApi(roomId, wordId, outcome);
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
	const buyItem = (roomId: string, itemId: EffectItemId) => {
		socketClient.emit(
			"buyItem",
			{ roomId, itemId },
			(state: PrivatePlayerState | null) => {
				if (state) {
					setPlayerState(state);
				}
			},
		);
	};
	const activateItem = (
		roomId: string,
		inventoryItemId: string,
		targetTeamId?: string,
		targetPlayerId?: string,
	) => {
		socketClient.emit(
			"useItem",
			{ roomId, inventoryItemId, targetTeamId, targetPlayerId },
			(state: PrivatePlayerState | null) => {
				if (state) {
					setPlayerState(state);
				}
			},
		);
	};
	return {
		startRound,
		nextWord,
		nextRound,
		changeWordOutcome,
		endPointing,
		finishRound,
		buyItem,
		activateItem,
	};
}
