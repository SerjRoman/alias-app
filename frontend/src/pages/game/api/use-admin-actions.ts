import { useCallback } from "react";
import { adminSocketApi } from "../api/admin-actions";

export const useAdminActions = (gameId: string) => {
	const setExplainer = useCallback(
		(playerId: string) => {
			adminSocketApi.setExplainer(gameId, playerId);
		},
		[gameId],
	);

	const createTeam = useCallback(
		(teamName: string) => {
			adminSocketApi.createTeam(gameId, teamName);
		},
		[gameId],
	);

	const deleteTeam = useCallback(
		(teamId: string) => {
			adminSocketApi.deleteTeam(gameId, teamId);
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

	const moveToSpectators = useCallback(
		(playerId: string) => {
			adminSocketApi.moveToSpectators(gameId, playerId);
		},
		[gameId],
	);

	return {
		setExplainer,
		createTeam,
		deleteTeam,
		kickPlayer,
		banPlayer,
		startRound,
		// finishRound,
		endGame,
		assignPlayerToTeam,
		shufflePlayers,
		changeRoundTime,
		startPointing,
		moveToSpectators,
	};
};
