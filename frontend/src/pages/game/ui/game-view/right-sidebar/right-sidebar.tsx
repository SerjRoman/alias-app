import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Target, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shared/ui";
import { useQuery } from "@shared/api";
import {
	useGameSlice,
	usePrivatePlayerSlice,
	type EffectItemId,
} from "@entities/game";
import { useActiveGameActions } from "../../../api/use-active-game-actions";
import type {
	ChatMessage,
	SystemLogEntry,
	GameQuest,
} from "../../../api/game-stubs";
import { ChatLogTab } from "./chat-log-tab";
import { QuestsTab } from "./quests-tab";
import { SettingsTab } from "./settings-tab";
import styles from "./right-sidebar.module.css";

const EMPTY_MESSAGES: ChatMessage[] = [];
const EMPTY_LOGS: SystemLogEntry[] = [];
const EMPTY_QUESTS: GameQuest[] = [];

export function RightSidebar() {
	const { t } = useTranslation();
	const roomId = useGameSlice((state) => state.game?.id ?? "");
	const walletBalance = usePrivatePlayerSlice((state) => state.balance);
	const { buyItem } = useActiveGameActions();
	const [channel, setChannel] = useState<"all" | "team">("all");

	const { data: shopCatalog } = useQuery(
		"get",
		"/games/{id}/shop",
		{
			params: {
				path: { id: roomId },
			},
		},
		{
			enabled: Boolean(roomId),
		},
	);

	const isChatLogEnabled = false;
	const messages = EMPTY_MESSAGES;
	const logs = EMPTY_LOGS;
	const quests = EMPTY_QUESTS;

	const handleSendMessage = () => {
		// TODO: wire chat slice/socket when ready
	};

	const handleClaimQuest = () => {
		// TODO: wire quest claim when ready
	};

	const handleBuyItem = (itemId: string) => {
		if (roomId) {
			buyItem(roomId, itemId as EffectItemId);
		}
	};

	return (
		<aside className={styles.sidebar}>
			<Tabs defaultValue={isChatLogEnabled ? "chat" : "quests"}>
				{/* Top Tab Switcher */}
				<TabsList variant="default">
					{isChatLogEnabled && (
						<TabsTrigger value="chat" variant="default">
							<MessageSquare size={14} />
							<span>{t("gameView.chatLogTab")}</span>
						</TabsTrigger>
					)}

					<TabsTrigger value="quests" variant="default">
						<Target size={14} />
						<span>{t("gameView.questsTab")}</span>
					</TabsTrigger>

					<TabsTrigger value="settings" variant="default">
						<Settings size={14} />
						<span>{t("gameView.settingsStoreTab")}</span>
					</TabsTrigger>
				</TabsList>

				{/* Tab Content */}
				{isChatLogEnabled && (
					<TabsContent value="chat" className={styles.tabContent}>
						<ChatLogTab
							messages={messages}
							logs={logs}
							channel={channel}
							onChannelChange={setChannel}
							onSendMessage={handleSendMessage}
						/>
					</TabsContent>
				)}

				<TabsContent value="quests" className={styles.tabContent}>
					<QuestsTab quests={quests} onClaim={handleClaimQuest} />
				</TabsContent>

				<TabsContent value="settings" className={styles.tabContent}>
					<SettingsTab
						walletBalance={walletBalance}
						shopItems={shopCatalog?.items ?? []}
						isShopEnabled={shopCatalog?.isShopEnabled ?? true}
						onBuyItem={handleBuyItem}
					/>
				</TabsContent>
			</Tabs>
		</aside>
	);
}
