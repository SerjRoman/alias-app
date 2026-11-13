import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { GameStateDetails, WordState } from "@entities/game";
import {
	FALLBACK_GAME_STATE,
	useGameChatStub,
	useGameBettingStub,
	useGameQuestsStub,
} from "../../api/game-stubs";
import { GameHeader } from "./header/game-header";
import { LeftSidebar } from "./left-sidebar/left-sidebar";
import { CenterArena } from "./center-arena/center-arena";
import { RightSidebar } from "./right-sidebar/right-sidebar";
import styles from "./game-view.module.css";

interface GameViewProps {
	game?: GameStateDetails | null;
	currentUserId?: string;
	currentUserName?: string;
	currentUserAvatar?: string;
}

export function GameView({
	game: propGame,
	currentUserName = "CyberFox",
	currentUserAvatar = "https://api.dicebear.com/7.x/bottts/svg?seed=CyberFox",
}: Readonly<GameViewProps>) {
	const navigate = useNavigate();

	// Use server game state if available; otherwise use the 5-team 25-player fallback
	const game = useMemo<GameStateDetails>(() => {
		if (propGame && propGame.teams && propGame.teams.length >= 2) {
			return propGame;
		}
		return FALLBACK_GAME_STATE;
	}, [propGame]);

	// Interactive demo state: Explainer vs Opponent perspective
	const [viewMode, setViewMode] = useState<"explainer" | "opponent">("explainer");

	// Stubs for Chat, Betting & Quests
	const { channel, setChannel, messages, logs, sendMessage, addLog } =
		useGameChatStub();
	const { activeBet, walletBalance, setWalletBalance, placeBet } =
		useGameBettingStub();
	const { quests, claimReward } = useGameQuestsStub();

	// Handlers
	const handleLeave = () => {
		navigate("/games");
	};

	const handleActionWord = (word: WordState, isSkip: boolean) => {
		addLog({
			type: isSkip ? "skip" : "score",
			text: isSkip
				? `Active team skipped '${word.text}' (-1 pt).`
				: `Active team correctly guessed '${word.text}' (+1 pt).`,
			highlight: isSkip ? "-1 pt" : "+1 pt",
		});
	};

	const handlePowerUpTrigger = (powerUpName: string) => {
		addLog({
			type: "info",
			text: `Tactical power-up used: ${powerUpName}`,
		});
	};

	const handleFoulReport = () => {
		addLog({
			type: "foul",
			text: "Rule challenge submitted: Cognate root infraction reported on active team.",
		});
	};

	const handlePlaceQuickBet = (option: string, odds: number) => {
		const success = placeBet(option, odds, 25);
		if (success) {
			addLog({
				type: "bet",
				text: `Bet placed: 25 💰 on '${option}' [${odds}x].`,
				highlight: "25 💰",
			});
		}
	};

	const handleClaimQuest = (questId: string) => {
		const quest = quests.find((q) => q.id === questId);
		if (quest && !quest.isClaimed) {
			claimReward(questId);
			setWalletBalance((prev) => prev + quest.reward);
			addLog({
				type: "info",
				text: `Quest completed! Collected +${quest.reward} 💰 from '${quest.title}'.`,
			});
		}
	};

	const handleBuyStoreItem = (itemId: string, price: number) => {
		if (walletBalance >= price) {
			setWalletBalance((prev) => prev - price);
			addLog({
				type: "info",
				text: `Purchased item '${itemId}' for ${price} 💰.`,
			});
		}
	};

	return (
		<div className={styles.gamePageLayout}>
			{/* 1. Top Header */}
			<GameHeader
				game={game}
				currentUserName={currentUserName}
				currentUserAvatar={currentUserAvatar}
				walletBalance={walletBalance}
				viewMode={viewMode}
				onToggleViewMode={setViewMode}
				onLeave={handleLeave}
			/>

			{/* 2. Main Stage Grid: Left Sidebar / Center Arena / Right Sidebar */}
			<div className={styles.mainStage}>
				<LeftSidebar game={game} />

				<CenterArena
					game={game}
					viewMode={viewMode}
					activeBet={activeBet}
					onActionWord={handleActionWord}
					onPowerUpTrigger={handlePowerUpTrigger}
					onFoulReport={handleFoulReport}
					onPlaceQuickBet={handlePlaceQuickBet}
				/>

				<RightSidebar
					messages={messages}
					logs={logs}
					quests={quests}
					channel={channel}
					walletBalance={walletBalance}
					onChannelChange={setChannel}
					onSendMessage={(text) => sendMessage(text, currentUserName)}
					onClaimQuest={handleClaimQuest}
					onBuyItem={handleBuyStoreItem}
				/>
			</div>
		</div>
	);
}
