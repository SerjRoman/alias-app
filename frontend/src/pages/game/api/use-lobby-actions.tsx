import { socketClient } from "@shared/api";

export function useLobbyActions() {
	const createTeam = (roomId: string, teamName: string) => {
		if (!teamName.trim()) return;
		socketClient.emit("createTeam", { roomId, teamName });
	};

	const deleteTeam = (roomId: string, teamId: string) => {
		socketClient.emit("deleteTeam", { roomId, teamId });
	};

	const joinTeam = (roomId: string, teamId: string) => {
		socketClient.emit("moveToTeam", { roomId, teamId });
	};

	const startGame = (roomId: string) => {
		socketClient.emit("startGame", { roomId });
	};

	const moveToSpectators = (roomId: string, playerId?: string) => {
		socketClient.emit("moveToSpectators", { roomId, playerId });
	};

	return { createTeam, deleteTeam, joinTeam, startGame, moveToSpectators };
}
