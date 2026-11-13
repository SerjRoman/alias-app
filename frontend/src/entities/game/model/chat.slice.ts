import { create } from "zustand";

export type ChatChannel = "all" | "team";

export type SystemLogType =
	| "info"
	| "effect"
	| "leader"
	| "round"
	| "admin"
	| "private";

export interface ChatMessage {
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

export interface SystemLogEntry {
	id: string;
	roomId: string;
	type: SystemLogType;
	i18nKey: string;
	i18nParams?: Record<string, string | number>;
	isPrivate?: boolean;
	createdAt: number;
}

interface ChatStore {
	messages: ChatMessage[];
	logs: SystemLogEntry[];
	unreadCount: number;
	isChatTabActive: boolean;
	setHistory: (messages: ChatMessage[], logs: SystemLogEntry[]) => void;
	addMessage: (msg: ChatMessage) => void;
	addLog: (log: SystemLogEntry) => void;
	setChatTabActive: (active: boolean) => void;
	resetChat: () => void;
}

const MAX_ITEMS = 100;

export const useChatSlice = create<ChatStore>((set) => ({
	messages: [],
	logs: [],
	unreadCount: 0,
	isChatTabActive: true,

	setHistory: (messages, logs) =>
		set({
			messages: messages.slice(-MAX_ITEMS),
			logs: logs.slice(-MAX_ITEMS),
		}),

	addMessage: (msg) =>
		set((state) => {
			if (state.messages.some((m) => m.id === msg.id)) {
				return state;
			}
			const nextMessages = [...state.messages, msg].slice(-MAX_ITEMS);
			return {
				messages: nextMessages,
				unreadCount: state.isChatTabActive
					? state.unreadCount
					: state.unreadCount + 1,
			};
		}),

	addLog: (log) =>
		set((state) => {
			if (state.logs.some((l) => l.id === log.id)) {
				return state;
			}
			return {
				logs: [...state.logs, log].slice(-MAX_ITEMS),
			};
		}),

	setChatTabActive: (active) =>
		set((state) => ({
			isChatTabActive: active,
			unreadCount: active ? 0 : state.unreadCount,
		})),

	resetChat: () =>
		set({
			messages: [],
			logs: [],
			unreadCount: 0,
		}),
}));
