import { Check, Megaphone, Mic } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PlayerState, PlayerDisplayInfo } from "@entities/game";
import { Avatar } from "../avatar";
import { PlayerProfilePopover } from "./player-profile-popover/player-profile-popover";
import styles from "./player-row.module.css";

interface PlayerRowProps {
	player: PlayerState;
	displayInfo?: PlayerDisplayInfo;
	isSpeaking?: boolean;
	isExplaining?: boolean;
	isRoundReady?: boolean;
	isTargetable?: boolean;
	onSelect?: () => void;
	showScore?: boolean;
}

export function PlayerRow({
	player,
	displayInfo,
	isSpeaking = false,
	isExplaining = false,
	isRoundReady = false,
	isTargetable = false,
	onSelect,
	showScore = true,
}: Readonly<PlayerRowProps>) {
	const { t } = useTranslation();
	const displayName = displayInfo?.name || player.name;
	const isRegistered =
		player.role === "registered" || Boolean(displayInfo?.username);

	const rowElement = (
		<div
			className={`${styles.playerRow} ${isSpeaking ? styles.speaking : ""} ${isRoundReady ? styles.roundReady : ""} ${isTargetable ? styles.targetable : ""}`}
			role={isTargetable ? "button" : undefined}
			tabIndex={0}
			onClick={isTargetable ? onSelect : undefined}
			onKeyDown={
				isTargetable
					? (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onSelect?.();
							}
						}
					: undefined
			}
		>
			<div className={styles.playerInfo}>
				<Avatar
					src={displayInfo?.avatarUrl}
					name={displayName}
					isSpeaking={isSpeaking}
					size={32}
				/>
				<span className={styles.playerName}>{displayName}</span>
			</div>

			<div className={styles.playerMeta}>
				{/* Live Speech Indicator */}
				{isSpeaking && (
					<span
						className={styles.speakingBadge}
						title={t("gameView.speakingNow")}
					>
						<Mic size={11} />
					</span>
				)}

				{/* Round Ready Badge */}
				{isRoundReady && (
					<span
						className={styles.readyBadge}
						title={t("gameView.readyForRound")}
					>
						<Check size={12} />
					</span>
				)}

				{/* Explainer Icon */}
				{isExplaining && (
					<span
						className={styles.explainingIcon}
						title={t("gameView.explainingClues")}
					>
						<Megaphone size={11} />
					</span>
				)}

				{showScore && (
					<span className={styles.playerScore}>
						+{player.score || 0}
					</span>
				)}
			</div>
		</div>
	);

	if (isTargetable) {
		return rowElement;
	}

	return (
		<PlayerProfilePopover
			playerId={player.id}
			name={displayName}
			username={displayInfo?.username}
			avatarUrl={displayInfo?.avatarUrl}
			isRegistered={isRegistered}
		>
			{rowElement}
		</PlayerProfilePopover>
	);
}
