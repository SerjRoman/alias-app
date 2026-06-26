import { useEffect } from "react";
import { useGameSlice } from "../model/game.slice";
import { socketClient } from "@shared/api";

export function useGameSync() {
	const updatePlayers = useGameSlice((state) => state.updatePlayers);
	const updateTeams = useGameSlice((state) => state.updateTeams);
	const updateGameSettings = useGameSlice((state) => state.updateGameSettings);
	const setGameState = useGameSlice((state) => state.setGameState);
	const updateRound = useGameSlice((state) => state.updateRound);

	useEffect(() => {
		socketClient.on("playersUpdated", updatePlayers);
		socketClient.on("teamsUpdated", updateTeams);
		socketClient.on("game-settings-updated", updateGameSettings);
		socketClient.on("gameUpdated", setGameState);
		socketClient.on("roundUpdated", updateRound);
		socketClient.on("gameStarted", setGameState);

		return () => {
			socketClient.off("playersUpdated", updatePlayers);
			socketClient.off("teamsUpdated", updateTeams);
			socketClient.off("game-settings-updated", updateGameSettings);
			socketClient.off("gameUpdated", setGameState);
			socketClient.off("gameStarted", setGameState);
			socketClient.off("roundUpdated", updateRound);
		};
	}, [updatePlayers, updateTeams, updateGameSettings, setGameState, updateRound]);
}
