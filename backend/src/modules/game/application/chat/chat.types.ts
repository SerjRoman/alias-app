export type ChatChannel = "all" | "team";

export const SYSTEM_LOG_KEYS = {
	ITEM_USED_PLAYER: "gameView.systemLogs.itemUsedPlayer",
	ITEM_USED_TEAM: "gameView.systemLogs.itemUsedTeam",
	ITEM_USED_SELF: "gameView.systemLogs.itemUsedSelf",
	ITEM_PURCHASED_PRIVATE: "gameView.systemLogs.itemPurchasedPrivate",
	NEW_LEADER: "gameView.systemLogs.newLeader",
	ROUND_STARTED: "gameView.systemLogs.roundStarted",
	ROUND_ENDED: "gameView.systemLogs.roundEnded",
	EXPLAINER_TEAM_CHAT_BLOCKED: "gameView.systemLogs.explainerTeamChatBlocked",
	SPECTATOR_TEAM_CHAT_BLOCKED: "gameView.systemLogs.spectatorTeamChatBlocked",
	adminAction: (action: AdminActionLogType) =>
		`gameView.systemLogs.adminAction.${action}` as const,
} as const;

export type SystemLogType =
	| "info"
	| "effect"
	| "leader"
	| "round"
	| "admin"
	| "private";

export interface ChatMessageDto {
	id: string;
	roomId: string;
	channel: ChatChannel;
	teamId?: string;
	senderId: string;
	senderName: string;
	senderTeamColor?: string;
	text: string;
	createdAt: number;
}

export interface SystemLogEntryDto {
	id: string;
	roomId: string;
	type: SystemLogType;
	i18nKey: string;
	i18nParams?: Record<string, string | number>;
	isPrivate?: boolean;
	targetUserId?: string;
	createdAt: number;
}

export interface ChatHistoryDto {
	messages: ChatMessageDto[];
	logs: SystemLogEntryDto[];
}

export const CHAT_MESSAGE_CREATED = "game.chat.message.created";
export type ChatMessageCreatedPayload = {
	roomId: string;
	message: ChatMessageDto;
};

export const SYSTEM_LOG_CREATED = "game.chat.system_log.created";
export type SystemLogCreatedPayload = {
	roomId: string;
	log: SystemLogEntryDto;
};

export type AdminActionLogType =
	| "kickPlayer"
	| "banPlayer"
	| "setExplainer"
	| "assignPlayerToTeam"
	| "shufflePlayers"
	| "changeRoundTime"
	| "startRound"
	| "startPointing"
	| "pauseGame"
	| "resumeGame"
	| "endGame";

export const ADMIN_ACTION_EXECUTED = "game.admin.action.executed";
export type AdminActionExecutedPayload = {
	roomId: string;
	adminId: string;
	adminName: string;
	action: AdminActionLogType;
	targetPlayerId?: string;
	targetTeamId?: string;
	targetName?: string;
	seconds?: number;
};
