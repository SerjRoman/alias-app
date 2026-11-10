import { socketClient } from "@shared/api";

export const adminSocketApi = {
	addTime: (gameId: string, seconds: number) => {
		socketClient.emit("admin:addTime", { roomId: gameId, seconds });
	},
	setExplainer: (gameId: string, playerId: string) => {
		socketClient.emit("admin:setExplainer", { roomId: gameId, playerId });
	},
	createTeam: (gameId: string, teamName: string) => {
		socketClient.emit("createTeam", { roomId: gameId, teamName });
	},
	deleteTeam: (gameId: string, teamId: string) => {
		socketClient.emit("deleteTeam", { roomId: gameId, teamId });
	},
	kickPlayer: (gameId: string, playerId: string) => {
		socketClient.emit("admin:kickPlayer", {
			roomId: gameId,
			playerId,
		});
	},
	banPlayer: (gameId: string, playerId: string) => {
		socketClient.emit("admin:banPlayer", {
			roomId: gameId,
			playerId,
		});
	},
	startRound: (gameId: string) => {
		socketClient.emit("admin:startRound", { roomId: gameId });
	},
	finishRound: (gameId: string) => {
		socketClient.emit("admin:finishRound", { roomId: gameId });
	},
	endGame: (gameId: string) => {
		socketClient.emit("admin:endGame", { roomId: gameId });
	},
	assignPlayerToTeam: (roomId: string, teamId: string, playerId: string) => {
		socketClient.emit("moveToTeam", { roomId, teamId, playerId });
	},
	shufflePlayers: (gameId: string) => {
		socketClient.emit("admin:shufflePlayers", { roomId: gameId });
	},
	changeRoundTime: (gameId: string, seconds: number) => {
		socketClient.emit("admin:changeRoundTime", { roomId: gameId, seconds });
	},
	startPointing: (gameId: string) => {
		socketClient.emit("admin:startPointing", { roomId: gameId });
	},
	moveToSpectators: (roomId: string, playerId: string) => {
		socketClient.emit("moveToSpectators", { roomId, playerId });
	},
};
