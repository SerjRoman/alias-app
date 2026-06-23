import { useEffect } from "react";
import { useGameSlice } from "../model/game.slice";
import { socketClient } from "@shared/api";

export function useGameSync() {
	const updatePlayers = useGameSlice((state) => state.updatePlayers);
	const updateTeams = useGameSlice((state) => state.updateTeams);
	const updateSettings = useGameSlice((state) => state.updateSettings);
	const setGameState = useGameSlice((state) => state.setGameState);
	const updateRound = useGameSlice((state) => state.updateRound);

	useEffect(() => {
		socketClient.on("playersUpdated", updatePlayers);
		socketClient.on("teamsUpdated", updateTeams);
		socketClient.on("updateGameSettings", updateSettings);
		socketClient.on("gameUpdated", setGameState);
		socketClient.on("roundUpdated", updateRound);
		socketClient.on("gameStarted", setGameState);

		return () => {
			socketClient.off("playersUpdated", updatePlayers);
			socketClient.off("teamsUpdated", updateTeams);
			socketClient.off("updateGameSettings", updateSettings);
			socketClient.off("gameUpdated", setGameState);
			socketClient.off("gameStarted", setGameState);
			socketClient.off("roundUpdated", updateRound);
		};
	}, [updatePlayers, updateTeams, updateSettings, setGameState, updateRound]);
}
