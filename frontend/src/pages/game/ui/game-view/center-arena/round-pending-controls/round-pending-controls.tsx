import { useTranslation } from "react-i18next";
import { Play } from "lucide-react";
import { useGameShortcuts, useGameSlice } from "@entities/game";
import { Button } from "@shared/ui/button";
import { useActiveGameActions, readyApi } from "../../../../api";
import { Avatar } from "../../avatar";
import { ToggleRoundReadyButton } from "../round-ready-button/round-ready-button";
import styles from "./round-pending-controls.module.css";

interface RoundPendingControlsProps {
	roomId: string;
	isMyTeamPlaying: boolean;
	isExplainer: boolean;
	isAllReady: boolean;
	myReadyState: boolean;
}

const TEAM_FALLBACK_COLORS = ["#f43f5e", "#0ea5e9", "#10b981", "#f59e0b"];

export function RoundPendingControls({
	roomId,
	isMyTeamPlaying,
	isExplainer,
	isAllReady,
	myReadyState,
}: Readonly<RoundPendingControlsProps>) {
	const { t } = useTranslation();
	const { startRound } = useActiveGameActions();
	const currentRound = useGameSlice((state) => state.game?.currentRound);
	const teams = useGameSlice((state) => state.game?.teams ?? []);
	const players = useGameSlice((state) => state.game?.players ?? []);

	const teamIndex = teams.findIndex((tm) => tm.id === currentRound?.teamId);
	const activeTeam = teamIndex >= 0 ? teams[teamIndex] : undefined;
	const teamColor =
		teamIndex >= 0
			? TEAM_FALLBACK_COLORS[teamIndex % TEAM_FALLBACK_COLORS.length]
			: "#38bdf8";
	const explainer = players.find((p) => p.id === currentRound?.explainerId);

	useGameShortcuts({
		onToggleReady: isMyTeamPlaying
			? () => readyApi.toggleRoundReady(roomId)
			: undefined,
	});

	return (
		<div className={styles.container}>
			{explainer && activeTeam && (
				<div className={styles.briefingCard}>
					<Avatar name={explainer.name} size={46} />
					<div className={styles.briefingMeta}>
						<span className={styles.briefingLabel}>
							{t("gameView.nextUp")}
						</span>
						<div className={styles.briefingWho}>
							<span className={styles.explainerName}>
								{explainer.name}
							</span>
							<span
								className={styles.teamPill}
								style={{
									borderColor: `${teamColor}66`,
									backgroundColor: `${teamColor}22`,
									color: teamColor,
								}}
							>
								{activeTeam.name}
							</span>
						</div>
					</div>
				</div>
			)}

			<h2 className={styles.title}>{t("activeGame.prepareTitle")}</h2>

			{isMyTeamPlaying ? (
				<div className={styles.readyBlock}>
					<ToggleRoundReadyButton
						roomId={roomId}
						isReady={myReadyState}
					/>
					<span className={styles.shortcutHint}>
						<kbd className={styles.kbdKey}>Space</kbd>
					</span>
				</div>
			) : (
				<p className={styles.spectatorMessage}>
					{t("activeGame.waitingForReady")}
				</p>
			)}

			{isExplainer && (
				<Button
					onClick={() => startRound(roomId)}
					className={styles.startBtn}
					disabled={!isAllReady}
				>
					<Play fill="currentColor" size={18} />
					{isAllReady
						? t("admin.startRound")
						: t("activeGame.waitingForTeammates")}
				</Button>
			)}
		</div>
	);
}
