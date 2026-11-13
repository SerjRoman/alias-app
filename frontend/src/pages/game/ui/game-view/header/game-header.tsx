import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Radio } from "lucide-react";
import { useGameSlice, useGameVoice } from "@entities/game";
import { Button } from "@shared/ui";
import { useAuth } from "@shared/api";
import { leaveGame } from "../../../api/leave-game";
import { Avatar } from "../avatar";
import { VoiceControls } from "./voice-controls";
import styles from "./game-header.module.css";

export function GameHeader() {
	const gameId = useGameSlice((state) => state.game?.id ?? "");
	const gameName = useGameSlice(
		(state) => state.game?.settings.name || "Alias Game",
	);
	const isVoiceChatEnabled = useGameSlice(
		(state) => state.game?.settings.isVoiceChatEnabled ?? false,
	);
	const currentRoundNumber = useGameSlice(
		(state) => state.game?.currentRound?.roundNumber ?? 4,
	);
	const voiceToken = useGameVoice((state) => state.voiceToken);
	const { user } = useAuth();
	const navigate = useNavigate();
	const { t } = useTranslation();

	if (!user) {
		return null;
	}

	const handleLeave = () => {
		leaveGame(gameId);
		void navigate("/games");
	};

	return (
		<header className={styles.header}>
			<div className={styles.leftSection}>
				<Button
					type="button"
					variant="outline"
					size="small"
					className={styles.leaveBtn}
					onClick={handleLeave}
					title={t("gameView.leaveTooltip")}
				>
					<LogOut size={16} />
					<span>{t("gameView.leave")}</span>
				</Button>

				<div className={styles.gameTitleBadge} title={gameName}>
					<span className={styles.gameTitleText}>{gameName}</span>
				</div>

				<div className={styles.roundBadge}>
					<span className={styles.roundDot} />
					<span>
						{t("gameView.round")} {currentRoundNumber}
					</span>
				</div>
			</div>

			<div className={styles.rightSection}>
				{isVoiceChatEnabled &&
					(voiceToken ? (
						<VoiceControls />
					) : (
						<div className={styles.voiceControlsGroup}>
							<div
								className={styles.voiceStatusBadge}
								title={t("gameView.connectingVoice")}
							>
								<span className={styles.pulseDot} />
								<Radio size={12} />
								<span>{t("gameView.connecting")}</span>
							</div>
						</div>
					))}
				<div
					className={styles.userProfile}
					title={`${t("gameView.signedInAs")} ${user.name}`}
				>
					<Avatar src={user.avatarUrl} name={user.name} size={32} />
					<span className={styles.userName}>{user.name}</span>
				</div>
			</div>
		</header>
	);
}
