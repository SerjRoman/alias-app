import { useState, useCallback } from "react";
import {
	GameStatus,
	RoundStatus,
	type GameStateDetails,
	type PlayerState,
	type TeamState,
	type WordState,
} from "@entities/game";

export interface ChatMessage {
	id: string;
	senderId: string;
	senderName: string;
	senderTeamColor?: string;
	text: string;
	time: string;
	isTeamOnly?: boolean;
}

export interface SystemLogEntry {
	id: string;
	time: string;
	type: "score" | "skip" | "foul" | "bet" | "info";
	text: string;
	highlight?: string;
}

export interface GameQuest {
	id: string;
	title: string;
	progress: number;
	target: number;
	reward: number;
	isClaimed?: boolean;
}

export interface ActiveBet {
	id: string;
	amount: number;
	optionText: string;
	odds: number;
	status: "winning" | "losing" | "pending";
	currentCount: number;
}

/**
 * 25-player fallback game state matching GameStateDetails for preview & standalone testing.
 */
const INITIAL_FALLBACK_PLAYERS: PlayerState[] = [
	// Team Red (t-1)
	{ id: "p-1", name: "Ivan", isReady: true, isRoundReady: true, score: 14, isOnline: true, role: "registered" },
	{ id: "p-2", name: "Alex", isReady: true, isRoundReady: true, score: 8, isOnline: true, role: "registered" },
	{ id: "p-3", name: "Maria", isReady: true, isRoundReady: true, score: 6, isOnline: true, role: "registered" },
	{ id: "p-4", name: "Dmitry", isReady: true, isRoundReady: true, score: 5, isOnline: true, role: "registered" },
	{ id: "p-5", name: "Elena", isReady: true, isRoundReady: true, score: 5, isOnline: true, role: "registered" },

	// Team Green (t-2)
	{ id: "p-6", name: "Oleg", isReady: true, isRoundReady: false, score: 12, isOnline: true, role: "registered" },
	{ id: "p-7", name: "Sophia", isReady: true, isRoundReady: false, score: 7, isOnline: true, role: "registered" },
	{ id: "p-8", name: "Maxim", isReady: true, isRoundReady: false, score: 5, isOnline: true, role: "registered" },
	{ id: "p-9", name: "Anna", isReady: true, isRoundReady: false, score: 4, isOnline: true, role: "registered" },
	{ id: "p-10", name: "Viktor", isReady: true, isRoundReady: false, score: 4, isOnline: true, role: "registered" },

	// Team Blue (t-3)
	{ id: "p-11", name: "Danila", isReady: true, isRoundReady: false, score: 10, isOnline: true, role: "registered" },
	{ id: "p-12", name: "Kate", isReady: true, isRoundReady: false, score: 6, isOnline: true, role: "registered" },
	{ id: "p-13", name: "Artyom", isReady: true, isRoundReady: false, score: 5, isOnline: true, role: "registered" },
	{ id: "p-14", name: "Alina", isReady: true, isRoundReady: false, score: 4, isOnline: true, role: "registered" },
	{ id: "p-15", name: "Denis", isReady: true, isRoundReady: false, score: 3, isOnline: true, role: "registered" },

	// Team Yellow (t-4)
	{ id: "p-16", name: "Yaroslav", isReady: true, isRoundReady: false, score: 9, isOnline: true, role: "registered" },
	{ id: "p-17", name: "Polina", isReady: true, isRoundReady: false, score: 6, isOnline: true, role: "registered" },
	{ id: "p-18", name: "Roman", isReady: true, isRoundReady: false, score: 4, isOnline: true, role: "registered" },
	{ id: "p-19", name: "Kristina", isReady: true, isRoundReady: false, score: 3, isOnline: true, role: "registered" },
	{ id: "p-20", name: "Nikita", isReady: true, isRoundReady: false, score: 2, isOnline: true, role: "registered" },

	// Team Purple (t-5)
	{ id: "p-21", name: "Timur", isReady: true, isRoundReady: false, score: 6, isOnline: true, role: "registered" },
	{ id: "p-22", name: "Daria", isReady: true, isRoundReady: false, score: 4, isOnline: true, role: "registered" },
	{ id: "p-23", name: "Ilya", isReady: true, isRoundReady: false, score: 3, isOnline: true, role: "registered" },
	{ id: "p-24", name: "Vlad", isReady: true, isRoundReady: false, score: 3, isOnline: true, role: "registered" },
	{ id: "p-25", name: "Kira", isReady: true, isRoundReady: false, score: 2, isOnline: true, role: "registered" },

	// Spectators (Unassigned viewers)
	{ id: "spec-1", name: "CyberViewer", isReady: false, isRoundReady: false, score: 0, isOnline: true, role: "registered" },
	{ id: "spec-2", name: "GlitchHunter", isReady: false, isRoundReady: false, score: 0, isOnline: true, role: "registered" },
	{ id: "spec-3", name: "PixelWatcher", isReady: false, isRoundReady: false, score: 0, isOnline: true, role: "registered" },
	{ id: "spec-4", name: "GhostRecon", isReady: false, isRoundReady: false, score: 0, isOnline: true, role: "registered" },
];

const INITIAL_FALLBACK_TEAMS: (TeamState & { color?: string })[] = [
	{
		id: "t-1",
		name: "Архитектура Таксономии",
		color: "#ef4444",
		score: 38,
		playerIds: ["p-1", "p-2", "p-3", "p-4", "p-5"],
		lastExplainerId: "p-1",
	},
	{
		id: "t-2",
		name: "Team Green",
		color: "#10b981",
		score: 32,
		playerIds: ["p-6", "p-7", "p-8", "p-9", "p-10"],
		lastExplainerId: "p-6",
	},
	{
		id: "t-3",
		name: "Team Blue",
		color: "#3b82f6",
		score: 28,
		playerIds: ["p-11", "p-12", "p-13", "p-14", "p-15"],
		lastExplainerId: "p-11",
	},
	{
		id: "t-4",
		name: "Team Yellow",
		color: "#f59e0b",
		score: 24,
		playerIds: ["p-16", "p-17", "p-18", "p-19", "p-20"],
		lastExplainerId: "p-16",
	},
	{
		id: "t-5",
		name: "Team Purple",
		color: "#a855f7",
		score: 18,
		playerIds: ["p-21", "p-22", "p-23", "p-24", "p-25"],
		lastExplainerId: "p-21",
	},
];

const INITIAL_GUESSED_WORDS: WordState[] = [
	{ id: "w-1", text: "SUPERNOVA", score: 1 },
	{ id: "w-2", text: "ALGORITHM", score: 1 },
	{ id: "w-3", text: "SUBMARINE", score: -1 },
	{ id: "w-4", text: "TELESCOPE", score: 1 },
	{ id: "w-5", text: "QUANTUM", score: 1 },
];

export const FALLBACK_GAME_STATE: GameStateDetails = {
	id: "42",
	ownerId: "p-1",
	status: GameStatus.IN_PROGRESS,
	playersCount: 25,
	settings: {
		name: "Multiplayer Alias Championship #42",
		pointsToWin: 50,
		roundTimeSeconds: 60,
		isPrivate: false,
		isVoiceChatEnabled: true,
		isShopEnabled: true,
	},
	teams: INITIAL_FALLBACK_TEAMS,
	players: INITIAL_FALLBACK_PLAYERS,
	winnerTeamId: null,
	activeTeamId: "t-1",
	spectators: ["spec-1", "spec-2", "spec-3", "spec-4"],
	currentRound: {
		id: "r-4",
		roundNumber: 4,
		explainerId: "p-1",
		teamId: "t-1",
		status: RoundStatus.IN_PROGRESS,
		expiresAt: Date.now() + 38_000,
		currentWord: {
			id: "cw-1",
			text: "SYNCHROPHAZOTRON",
			score: 1,
		},
		words: INITIAL_GUESSED_WORDS,
	},
};

const DYNAMIC_PALETTE = ["#ef4444", "#10b981", "#3b82f6", "#f59e0b", "#a855f7", "#06b6d4", "#ec4899"];

export function getDynamicTeamColor(team: { color?: string }, index: number): string {
	return team.color || DYNAMIC_PALETTE[index % DYNAMIC_PALETTE.length];
}

/**
 * Chat API Stub
 */
export function useGameChatStub() {
	const [channel, setChannel] = useState<"all" | "team">("all");
	const [messages, setMessages] = useState<ChatMessage[]>([
		{
			id: "m-1",
			senderId: "p-2",
			senderName: "Alex",
			senderTeamColor: "#ef4444",
			time: "15:41",
			text: "Ivan, give synonyms, not definitions!",
		},
		{
			id: "m-2",
			senderId: "p-6",
			senderName: "Oleg",
			senderTeamColor: "#10b981",
			time: "15:42",
			text: "They are burning through the clock haha!",
		},
		{
			id: "m-3",
			senderId: "p-11",
			senderName: "Danila",
			senderTeamColor: "#3b82f6",
			time: "15:42",
			text: "My bet is looking very safe right now 😎",
		},
		{
			id: "m-4",
			senderId: "p-3",
			senderName: "Maria",
			senderTeamColor: "#ef4444",
			time: "15:43",
			text: "Next word Ivan, don't stall!!",
		},
	]);

	const [logs, setLogs] = useState<SystemLogEntry[]>([
		{
			id: "l-1",
			time: "15:42:02",
			type: "info",
			text: "Round 4 started. Active team: Team Red.",
		},
		{
			id: "l-2",
			time: "15:42:08",
			type: "bet",
			text: "Danila placed a bet of 50 💰 on '< 6 words' [x1.85].",
			highlight: "50 💰",
		},
		{
			id: "l-3",
			time: "15:42:15",
			type: "score",
			text: "Team Red correctly guessed 'SUPERNOVA' (+1 pt).",
			highlight: "+1 pt",
		},
		{
			id: "l-4",
			time: "15:42:24",
			type: "score",
			text: "Team Red correctly guessed 'ALGORITHM' (+1 pt).",
			highlight: "+1 pt",
		},
		{
			id: "l-5",
			time: "15:42:35",
			type: "skip",
			text: "Team Red skipped 'SUBMARINE' (-1 pt).",
			highlight: "-1 pt",
		},
		{
			id: "l-6",
			time: "15:42:41",
			type: "foul",
			text: "Oleg challenged rule violation on 'SUBMARINE'.",
		},
		{
			id: "l-7",
			time: "15:42:49",
			type: "score",
			text: "Team Red correctly guessed 'QUANTUM' (+1 pt).",
			highlight: "+1 pt",
		},
	]);

	const sendMessage = useCallback(
		(text: string, senderName = "You", senderTeamColor?: string) => {
			if (!text.trim()) return;
			const newMsg: ChatMessage = {
				id: `msg-${Date.now()}`,
				senderId: "self",
				senderName,
				senderTeamColor: senderTeamColor || "#38bdf8",
				time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
				text,
				isTeamOnly: channel === "team",
			};
			setMessages((prev) => [...prev, newMsg]);
		},
		[channel],
	);

	const addLog = useCallback((entry: Omit<SystemLogEntry, "id" | "time">) => {
		const newLog: SystemLogEntry = {
			...entry,
			id: `log-${Date.now()}`,
			time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
		};
		setLogs((prev) => [...prev, newLog]);
	}, []);

	return {
		channel,
		setChannel,
		messages,
		logs,
		sendMessage,
		addLog,
	};
}

/**
 * Betting API Stub
 */
export function useGameBettingStub() {
	const [activeBet, setActiveBet] = useState<ActiveBet>({
		id: "bet-1",
		amount: 50,
		optionText: "< 6 words",
		odds: 1.85,
		status: "winning",
		currentCount: 4,
	});

	const [walletBalance, setWalletBalance] = useState<number>(150);

	const placeBet = useCallback((optionText: string, odds: number, amount: number) => {
		if (amount > walletBalance) return false;
		setWalletBalance((prev) => prev - amount);
		setActiveBet({
			id: `bet-${Date.now()}`,
			amount,
			optionText,
			odds,
			status: "pending",
			currentCount: 0,
		});
		return true;
	}, [walletBalance]);

	return {
		activeBet,
		walletBalance,
		setWalletBalance,
		placeBet,
	};
}

/**
 * Quests API Stub
 */
export function useGameQuestsStub() {
	const [quests, setQuests] = useState<GameQuest[]>([
		{
			id: "q-1",
			title: "Win 3 bets in a row",
			progress: 2,
			target: 3,
			reward: 50,
		},
		{
			id: "q-2",
			title: "Guess 5 words under 10 seconds",
			progress: 3,
			target: 5,
			reward: 100,
		},
		{
			id: "q-3",
			title: "Participate in 5 rounds without fouls",
			progress: 4,
			target: 5,
			reward: 75,
		},
		{
			id: "q-4",
			title: "Use 2 tactical sabotage items",
			progress: 2,
			target: 2,
			reward: 60,
			isClaimed: false,
		},
	]);

	const claimReward = useCallback((questId: string) => {
		setQuests((prev) =>
			prev.map((q) => (q.id === questId ? { ...q, isClaimed: true } : q)),
		);
	}, []);

	return { quests, claimReward };
}
