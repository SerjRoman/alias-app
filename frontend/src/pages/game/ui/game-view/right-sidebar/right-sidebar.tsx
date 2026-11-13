import { useState } from "react";
import { MessageSquare, Target, Settings } from "lucide-react";
import type { ChatMessage, SystemLogEntry, GameQuest } from "../../../api/game-stubs";
import { ChatLogTab } from "./chat-log-tab";
import { QuestsTab } from "./quests-tab";
import { SettingsTab } from "./settings-tab";
import styles from "./right-sidebar.module.css";

interface RightSidebarProps {
	messages: ChatMessage[];
	logs: SystemLogEntry[];
	quests: GameQuest[];
	channel: "all" | "team";
	walletBalance: number;
	onChannelChange: (channel: "all" | "team") => void;
	onSendMessage: (text: string) => void;
	onClaimQuest: (questId: string) => void;
	onBuyItem?: (itemId: string, price: number) => void;
}

export function RightSidebar({
	messages,
	logs,
	quests,
	channel,
	walletBalance,
	onChannelChange,
	onSendMessage,
	onClaimQuest,
	onBuyItem,
}: Readonly<RightSidebarProps>) {
	const [activeTab, setActiveTab] = useState<"chat" | "quests" | "settings">("chat");

	return (
		<aside className={styles.sidebar}>
			{/* Top Tab Switcher */}
			<nav className={styles.tabNav}>
				<button
					type="button"
					className={`${styles.tabBtn} ${activeTab === "chat" ? styles.active : ""}`}
					onClick={() => setActiveTab("chat")}
				>
					<MessageSquare size={14} />
					<span>Chat &amp; Log</span>
				</button>

				<button
					type="button"
					className={`${styles.tabBtn} ${activeTab === "quests" ? styles.active : ""}`}
					onClick={() => setActiveTab("quests")}
				>
					<Target size={14} />
					<span>Quests</span>
				</button>

				<button
					type="button"
					className={`${styles.tabBtn} ${activeTab === "settings" ? styles.active : ""}`}
					onClick={() => setActiveTab("settings")}
				>
					<Settings size={14} />
					<span>Settings / Store</span>
				</button>
			</nav>

			{/* Tab Content */}
			<div className={styles.tabContent}>
				{activeTab === "chat" && (
					<ChatLogTab
						messages={messages}
						logs={logs}
						channel={channel}
						onChannelChange={onChannelChange}
						onSendMessage={onSendMessage}
					/>
				)}

				{activeTab === "quests" && (
					<QuestsTab quests={quests} onClaim={onClaimQuest} />
				)}

				{activeTab === "settings" && (
					<SettingsTab walletBalance={walletBalance} onBuyItem={onBuyItem} />
				)}
			</div>
		</aside>
	);
}
