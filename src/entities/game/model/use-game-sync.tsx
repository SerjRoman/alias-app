import { useEffect } from "react";
import { socketClient } from "../../../shared/api/socket";
import { useGameSlice } from "./game.slice";

export function useGameSync() {
	const { updatePlayers, updateTeams, updateSettings, setGameState } =
		useGameSlice();

	useEffect(() => {
		socketClient.on("playersUpdated", updatePlayers);
		socketClient.on("teamsUpdated", updateTeams);
		socketClient.on("updateGameSettings", updateSettings);
		socketClient.on("gameUpdated", setGameState);

		return () => {
			socketClient.off("playersUpdated", updatePlayers);
			socketClient.off("teamsUpdated", updateTeams);
			socketClient.off("updateGameSettings", updateSettings);
			socketClient.off("gameUpdated", setGameState);
		};
	}, [updatePlayers, updateTeams, updateSettings, setGameState]);
}
