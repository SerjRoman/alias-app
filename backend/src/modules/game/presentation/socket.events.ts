export const ADMIN_EVENTS = {
	setExplainer: "admin:setExplainer",
	kickPlayer: "admin:kickPlayer",
	banPlayer: "admin:banPlayer",
	startRound: "admin:startRound",
	startPointing: "admin:startPointing",
	endGame: "admin:endGame",
	assignPlayerToTeam: "admin:assignPlayerToTeam",
	shufflePlayers: "admin:shufflePlayers",
	changeRoundTime: "admin:changeRoundTime",
	pauseGame: "admin:pauseGame",
	resumeGame: "admin:resumeGame",
} as const;
