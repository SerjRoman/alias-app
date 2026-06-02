import { socketClient } from "@shared/api";

export const adminSocketApi = {
	addTime: (gameId: string, seconds: number) => {
		socketClient.emit("admin:addTime", { roomId: gameId, seconds });
	},
	setGuesser: (gameId: string, playerId: string) => {
		socketClient.emit("admin:setGuesser", { roomId: gameId, playerId });
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
};
