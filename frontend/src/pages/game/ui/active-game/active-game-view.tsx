import { useNavigate } from "react-router-dom";
import { ActiveGameTeamView } from "./team-view/team-view";
import { RoundInProgressBlock } from "./round-in-progress/round-in-progress-block";
import { RoundPendingControls } from "./round-pending-controls/round-pending-controls";
import { RoundFinishedResults } from "./round-finished-results/round-finished-results";
import styles from "./active-game-view.module.css";
import { useAuth } from "@entities/auth";
import { useGameSlice, RoundStatus } from "@entities/game";
import { useActiveGameSync } from "../../api";
import { RoundPointing } from "./round-pointing/round-pointing";

export function ActiveGameView() {
	const { game } = useGameSlice();
	const { user } = useAuth();
	const navigate = useNavigate();
	useActiveGameSync();

	if (!game || !user || !game.currentRound) {
		navigate("/games");
		return null;
	}

	const currentRound = game.currentRound;
	const playersMap = new Map(game.players.map((p) => [p.id, p]));

	const mePlayer = game.players.find((p) => user.id === p.id);
	const isGuesser = game.currentRound.guesserId === user.id;
	const isOwner = game.ownerId === user.id;

	const isMyTeamPlaying = game.teams.find(
		(team) =>
			team.id === currentRound.teamId && team.playerIds.includes(user.id),
	);

	const isAllReady = isMyTeamPlaying?.playerIds.every(
		(pId) => playersMap.get(pId)?.isRoundReady,
	);
	return (
		<div className={styles.container}>
			<div className={styles.teamsGrid}>
				{game.teams.map((team) => (
					<ActiveGameTeamView
						key={team.id}
						team={team}
						isOwner={isOwner}
						roomId={game.id}
					/>
				))}
			</div>

			<div className={styles.playZone}>
				{currentRound.status === RoundStatus.PENDING && (
					<RoundPendingControls
						roomId={game.id}
						isMyTeamPlaying={!!isMyTeamPlaying}
						isGuesser={isGuesser}
						isAllReady={!!isAllReady}
						myReadyState={mePlayer?.isRoundReady || false}
					/>
				)}

				{currentRound.status === RoundStatus.IN_PROGRESS && (
					<RoundInProgressBlock
						roomId={game.id}
						isGuesser={isGuesser}
						endTime={currentRound.endTime}
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
