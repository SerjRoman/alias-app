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
	category?: string;
	amount: number;
	optionText: string;
	odds: number;
	status: "winning" | "losing" | "pending";
	currentCount?: number;
}

const DYNAMIC_PALETTE = [
	"#ef4444",
	"#10b981",
	"#3b82f6",
	"#f59e0b",
	"#a855f7",
	"#06b6d4",
	"#ec4899",
];

export function getDynamicTeamColor(
	team: { color?: string },
	index: number,
): string {
	return team.color || DYNAMIC_PALETTE[index % DYNAMIC_PALETTE.length];
}
