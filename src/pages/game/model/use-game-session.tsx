import { useGameSlice } from "@entities/game/model";
import { joinGame } from "@features/join-game";
import { socketClient } from "@shared/api/socket";
import { useEffect, useRef, useState } from "react";

export function useGameSession(roomId: string | null, code: string | null) {
	const { game, clearGame } = useGameSlice();
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
			joinGame(roomId, code, () => {
				setIsLoading(false);
			});
		}
	}, [roomId, code, game?.id]);

	useEffect(() => {
		return () => {
			const activeId = gameIdRef.current;
			if (activeId) {
				// socketClient.emit("leaveGame", { roomId: activeId });
				clearGame();
			}
		};
	}, [clearGame]);

	return { isLoading, game };
}
