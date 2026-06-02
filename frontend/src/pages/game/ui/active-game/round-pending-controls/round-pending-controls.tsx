import { useActiveGameActions, readyApi } from "../../../api";
import { Play } from "lucide-react";
import styles from "./round-pending-controls.module.css";
import { ToggleRoundReadyButton } from "../round-ready-button/round-ready-button";
import { Button } from "@shared/ui/button";
import { useGameShortcuts } from "@entities/game";
import { useTranslation } from "react-i18next";

interface RoundPendingControlsProps {
	roomId: string;
	isMyTeamPlaying: boolean;
	isGuesser: boolean;
	isAllReady: boolean;
	myReadyState: boolean;
}

export function RoundPendingControls({
	roomId,
	isMyTeamPlaying,
	isGuesser,
	isAllReady,
	myReadyState,
}: Readonly<RoundPendingControlsProps>) {
	const { t } = useTranslation();
	const { startRound } = useActiveGameActions();

	useGameShortcuts({
		onToggleReady: isMyTeamPlaying ? () => readyApi.toggleRoundReady(roomId) : undefined,
	});

	return (
		<div className={styles.container}>
			<h2>{t("activeGame.prepareTitle")}</h2>
			{isMyTeamPlaying ? (
				<ToggleRoundReadyButton
					roomId={roomId}
					isReady={myReadyState}
				/>
			) : (
				<p className={styles.spectatorMessage}>
					{t("activeGame.waitingForReady")}
				</p>
			)}

			{isGuesser && (
				<Button
					onClick={() => startRound(roomId)}
					className={styles.startBtn}
					disabled={!isAllReady}
				>
					<Play fill="white" size={24} />
					{isAllReady ? t("admin.startRound") : t("activeGame.waitingForTeammates")}
				</Button>
			)}
		</div>
	);
}
