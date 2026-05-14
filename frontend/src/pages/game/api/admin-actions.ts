import { socketClient } from "@shared/api";

export const adminSocketApi = {
	addTime: (gameId: string, seconds: number) => {
		socketClient.emit("admin:addTime", { roomId: gameId, seconds });
	},
	setGuesser: (gameId: string, playerId: string) => {
		socketClient.emit("admin:setGuesser", { roomId: gameId, playerId });
	},
	kickPlayer: (gameId: string, playerId: string) => {
		socketClient.emit("kickPlayer", {
			roomId: gameId,
			playerId,
		});
	},
	startRound: (gameId: string) => {
		socketClient.emit("admin:startRound", { roomId: gameId });
	},
	endRound: (gameId: string) => {
		socketClient.emit("admin:endRound", { roomId: gameId });
	},
	endGame: (gameId: string) => {
		socketClient.emit("admin:endGame", { roomId: gameId });
	},
	assignPlayerToTeam: (roomId: string, teamId: string, playerId: string) => {
		socketClient.emit("moveToTeam", { roomId, teamId, playerId });
	},
};
