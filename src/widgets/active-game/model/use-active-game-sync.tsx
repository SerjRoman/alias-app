import { useGameSlice } from "@entities/game/model";
import { socketClient } from "@shared/api/socket";
import { useEffect } from "react";

export function useActiveGameSync() {
	const { updateRound } = useGameSlice();
	useEffect(() => {
		socketClient.on("roundFinished", updateRound);

		return () => {
			socketClient.off("roundFinished", updateRound);
		};
	}, [updateRound]);
}
