import { useCallback } from "react";
import { adminSocketApi } from "../api/admin-actions";

export const useAdminActions = (gameId: string) => {
	const addTime = useCallback(
		(seconds: number) => {
			adminSocketApi.addTime(gameId, seconds);
		},
		[gameId],
	);

	const setGuesser = useCallback(
		(playerId: string) => {
			adminSocketApi.setGuesser(gameId, playerId);
		},
		[gameId],
	);

	const kickPlayer = useCallback(
		(playerId: string) => {
			adminSocketApi.kickPlayer(gameId, playerId);
		},
		[gameId],
	);

	const startRound = useCallback(() => {
		adminSocketApi.startRound(gameId);
	}, [gameId]);

	const endRound = useCallback(() => {
		adminSocketApi.endRound(gameId);
	}, [gameId]);

	const endGame = useCallback(() => {
		adminSocketApi.endGame(gameId);
	}, [gameId]);
	const assignPlayerToTeam = (teamId: string, playerId: string) => {
		adminSocketApi.assignPlayerToTeam(gameId, teamId, playerId);
	};

	return {
		addTime,
		setGuesser,
		kickPlayer,
		startRound,
		endRound,
		endGame,
		assignPlayerToTeam,
	};
};
