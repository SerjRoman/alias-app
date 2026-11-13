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

		if (!roomId) return;

		setIsLoading(true);
		if (socketClient.connected) {
			joinGame(roomId, code, (gameData) => {
				setGameState(gameData);
				setIsLoading(false);
			});
		} else {
			socketClient.connect();
		}
	}, [roomId, code, game, setGameState]);

	useEffect(() => {
		if (!roomId) return;

		const handleConnect = () => {
			console.log("Socket connected. Joining room:", roomId);
			joinGame(roomId, code, (gameData) => {
				setGameState(gameData);
				setIsLoading(false);
			});
		};

		socketClient.on("connect", handleConnect);
		return () => {
			socketClient.off("connect", handleConnect);
		};
	}, [roomId, code, setGameState]);

	useEffect(() => {
		return () => {
			if (gameIdRef.current) {
				clearGame();
			}
		};
	}, [clearGame]);

	return { isLoading, game };
}
