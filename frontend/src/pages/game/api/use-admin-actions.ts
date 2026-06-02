import { useCallback } from "react";
import { adminSocketApi } from "../api/admin-actions";

export const useAdminActions = (gameId: string) => {
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

	const banPlayer = useCallback(
		(playerId: string) => {
			adminSocketApi.banPlayer(gameId, playerId);
		},
		[gameId],
	);

	const startRound = useCallback(() => {
		adminSocketApi.startRound(gameId);
	}, [gameId]);

	// const finishRound = useCallback(() => {
	// 	adminSocketApi.finishRound(gameId);
	// }, [gameId]);

	const endGame = useCallback(() => {
		adminSocketApi.endGame(gameId);
	}, [gameId]);

	const startPointing = useCallback(() => {
		adminSocketApi.startPointing(gameId);
	}, [gameId]);
	const assignPlayerToTeam = (teamId: string, playerId: string) => {
		adminSocketApi.assignPlayerToTeam(gameId, teamId, playerId);
	};

	const shufflePlayers = useCallback(() => {
		adminSocketApi.shufflePlayers(gameId);
	}, [gameId]);

	const changeRoundTime = useCallback(
		(seconds: number) => {
			adminSocketApi.changeRoundTime(gameId, seconds);
		},
		[gameId],
	);

	return {
		setGuesser,
		kickPlayer,
		banPlayer,
		startRound,
		// finishRound,
		endGame,
		assignPlayerToTeam,
		shufflePlayers,
		changeRoundTime,
		startPointing,
	};
};
