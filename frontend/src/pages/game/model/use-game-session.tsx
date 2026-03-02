import { useGameSlice } from "@entities/game";
import { socketClient } from "@shared/api";
import { useEffect, useRef, useState } from "react";
import { joinGame } from "../api/join-game";

export function useGameSession(roomId: string | null, code: string | null) {
	const { game, clearGame, setGameState } = useGameSlice();
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const gameIdRef = useRef(game?.id);

	useEffect(() => {
		gameIdRef.current = game?.id;
	}, [game?.id]);

	useEffect(() => {
		if (game?.id === roomId) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setIsLoading(false);
			return;
		}

		if (roomId) {
			setIsLoading(true);
			joinGame(roomId, code, (gameData) => {
				setGameState(gameData);
				setIsLoading(false);
			});
		}
	}, [roomId, code, game, setGameState]);

	useEffect(() => {
		return () => {
			const activeId = gameIdRef.current;
			if (activeId) {
				socketClient.disconnect();
				clearGame();
			}
		};
	}, [clearGame]);

	return { isLoading, game };
}
