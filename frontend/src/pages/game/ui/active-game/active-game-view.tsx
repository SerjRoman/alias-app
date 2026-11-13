import { useNavigate } from "react-router-dom";
import { ActiveGameTeamView } from "./team-view/team-view";
import { RoundInProgressBlock } from "./round-in-progress/round-in-progress-block";
import { RoundPendingControls } from "./round-pending-controls/round-pending-controls";
import { RoundFinishedResults } from "./round-finished-results/round-finished-results";
import styles from "./active-game-view.module.css";
import { useAuth } from "@shared/api";
import { useGameSlice, RoundStatus, type PlayerDisplayInfo } from "@entities/game";
import { useActiveGameSync } from "../../api";
import { RoundPointing } from "./round-pointing/round-pointing";
import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SpectatorsList } from "../spectators-list";

interface ActiveGameViewProps {
	playersDisplayMap: Map<string, PlayerDisplayInfo>;
}

export function ActiveGameView({ playersDisplayMap }: Readonly<ActiveGameViewProps>) {
	const { t } = useTranslation();
	const { game } = useGameSlice();
	const { user } = useAuth();
	const navigate = useNavigate();
	useActiveGameSync();

	if (!game || !user || !game.currentRound) {
		void navigate("/games");
		return null;
	}

	const currentRound = game.currentRound;
	const playersMap = new Map(game.players.map((p) => [p.id, p]));

	const mePlayer = game.players.find((p) => user.id === p.id);
	const isExplainer = game.currentRound.explainerId === user.id;
	const isOwner = game.ownerId === user.id;
	const allAssignedIds = new Set(game.teams.flatMap((t) => t.playerIds));
	const isSpectator =
		game.spectators?.includes(user.id) ||
		!allAssignedIds.has(user.id);

	const spectatorPlayers = game.players.filter(
		(p) => game.spectators?.includes(p.id) || !allAssignedIds.has(p.id),
	);

	const isMyTeamPlaying = game.teams.find(
		(team) =>
			team.id === currentRound.teamId && team.playerIds.includes(user.id),
	);

	const isAllReady = isMyTeamPlaying?.playerIds.every(
		(pId) => playersMap.get(pId)?.isRoundReady,
	);
	return (
		<div className={styles.container}>
			{isSpectator && (
				<div className={styles.spectatorBanner}>
					<Eye size={18} />
					<span>{t("activeGame.spectatorBanner")}</span>
				</div>
			)}
			<div className={styles.teamsGrid}>
				{game.teams.map((team) => (
					<ActiveGameTeamView
						key={team.id}
						team={team}
						isOwner={isOwner}
						roomId={game.id}
						playersDisplayMap={playersDisplayMap}
					/>
				))}
			</div>

			<SpectatorsList
				players={spectatorPlayers}
				playersDisplayMap={playersDisplayMap}
			/>

			<div className={styles.playZone}>
				{currentRound.status === RoundStatus.PENDING && (
					<RoundPendingControls
						roomId={game.id}
						isMyTeamPlaying={!!isMyTeamPlaying}
						isExplainer={isExplainer}
						isAllReady={!!isAllReady}
						myReadyState={mePlayer?.isRoundReady || false}
					/>
				)}

				{currentRound.status === RoundStatus.IN_PROGRESS && (
					<RoundInProgressBlock
						roomId={game.id}
						isExplainer={isExplainer}
						expiresAt={currentRound.expiresAt}
						pausedAt={currentRound.pausedAt}
						words={currentRound.words}
					/>
				)}
				{currentRound.status === RoundStatus.POINTING && (
					<RoundPointing
						roomId={game.id}
						words={currentRound.words}
						isOwner={isOwner}
					/>
				)}

				{currentRound.status === RoundStatus.FINISHED && (
					<RoundFinishedResults
						roomId={game.id}
						words={currentRound.words}
						isOwner={isOwner}
					/>
				)}
			</div>
		</div>
	);
}
