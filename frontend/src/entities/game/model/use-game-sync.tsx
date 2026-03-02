import { useEffect } from "react";
import { useGameSlice } from "./game.slice";
import { socketClient } from "@shared/api";

export function useGameSync() {
	const {
		updatePlayers,
		updateTeams,
		updateSettings,
		setGameState,
		updateRound,
	} = useGameSlice();

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
