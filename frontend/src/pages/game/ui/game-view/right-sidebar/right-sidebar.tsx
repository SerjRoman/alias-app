import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Target, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shared/ui";
import { useAuth, useQuery } from "@shared/api";
import {
	RoundStatus,
	useChatSlice,
	useGameSlice,
	usePrivatePlayerSlice,
	type ChatChannel,
	type EffectItemId,
} from "@entities/game";
import { useActiveGameActions } from "../../../api/use-active-game-actions";
import type { GameQuest } from "../../../api/game-stubs";
import { ChatLogTab } from "./chat-log-tab";
import { QuestsTab } from "./quests-tab";
import { SettingsTab } from "./settings-tab";
import styles from "./right-sidebar.module.css";

const EMPTY_QUESTS: GameQuest[] = [];

export function RightSidebar() {
	const { t } = useTranslation();
	const { user } = useAuth();
	const roomId = useGameSlice((state) => state.game?.id ?? "");
	const currentRound = useGameSlice((state) => state.game?.currentRound);
	const teams = useGameSlice((state) => state.game?.teams ?? []);
	const walletBalance = usePrivatePlayerSlice((state) => state.balance);
	const messages = useChatSlice((state) => state.messages);
	const logs = useChatSlice((state) => state.logs);
	const unreadCount = useChatSlice((state) => state.unreadCount);
	const setChatTabActive = useChatSlice((state) => state.setChatTabActive);
	const { buyItem, sendChatMessage } = useActiveGameActions();
	const [channel, setChannel] = useState<ChatChannel>("all");

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

	const hasTeam = Boolean(
		user?.id && teams.some((team) => team.playerIds?.includes(user.id)),
	);
	const isActiveExplainer = Boolean(
		user?.id &&
			currentRound?.status === RoundStatus.IN_PROGRESS &&
			currentRound.explainerId === user.id,
	);
	const quests = EMPTY_QUESTS;

	const handleSendMessage = (text: string) => {
		if (!roomId) return;
		sendChatMessage(roomId, channel, text);
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
			<Tabs
				defaultValue="chat"
				onValueChange={(value) => setChatTabActive(value === "chat")}
			>
				{/* Top Tab Switcher */}
				<TabsList variant="default">
					<TabsTrigger value="chat" variant="default">
						<MessageSquare size={14} />
						<span>{t("gameView.chatLogTab")}</span>
						{unreadCount > 0 && (
							<span className={styles.unreadBadge}>
								{unreadCount > 99 ? "99+" : unreadCount}
							</span>
						)}
					</TabsTrigger>

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
				<TabsContent value="chat" className={styles.tabContent}>
					<ChatLogTab
						messages={messages}
						logs={logs}
						channel={channel}
						hasTeam={hasTeam}
						isActiveExplainer={isActiveExplainer}
						onChannelChange={setChannel}
						onSendMessage={handleSendMessage}
					/>
				</TabsContent>

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
