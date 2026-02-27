import { RoundStatus, useGameSlice } from "@entities/game/model";
import styles from "./active-game-view.module.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@entities/auth/model";
import { ActiveGameTeamView } from "./team-view/team-view";
import { ToggleRoundReadyButton } from "@features/toggle-ready/ui";
import { useActiveGameActions } from "../model/use-active-game-actions";
import { Play } from "lucide-react";
import { Timer } from "@shared/ui/timer";

export function ActiveGameView() {
	const { game } = useGameSlice();
	const { user } = useAuth();
	const navigate = useNavigate();
	const { startRound, nextWord, nextRound } = useActiveGameActions();
	if (!game || !user || !game.currentRound) {
		navigate("/games");
		return null;
	}
	const currentRound = game.currentRound;

	const mePlayer = game.players.find((p) => user.id === p.id);
	const isGuesser = game.currentRound.guesserId === user.id;
	const isAllReady = game.players.every((p) => p.isRoundReady);
	const isOwner = game.ownerId === user.id;
	const isMyTeamPlaying = game.teams.find(
		(team) =>
			team.id === currentRound.teamId &&
			team.playerIds.includes(user.id),
	);

	return (
		<div>
			<div className={styles.teamsGrid}>
				{game.teams.map((team) => (
					<ActiveGameTeamView key={team.id} team={team} />
				))}
			</div>
			{isMyTeamPlaying && (
				<div className={styles.toggleReadyContainer}>
					<ToggleRoundReadyButton
						roomId={game.id}
						isReady={mePlayer?.isRoundReady || false}
					/>
				</div>
			)}
			<div>
				{currentRound.words.map((word) => (
					<div key={word.id}>
						<p>Word: {word.word}</p>
						<p>Score: {word.score}</p>
					</div>
				))}
			</div>
			{currentRound.status === RoundStatus.IN_PROGRESS && (
				<div>
					<Timer endTime={currentRound.endTime} />
				</div>
			)}
			{isGuesser && currentRound.status === RoundStatus.IN_PROGRESS && (
				<div>
					<button onClick={() => nextWord(game.id, false)}>
						Next Word
					</button>
					<button onClick={() => nextWord(game.id, true)}>
						Skip word
					</button>
				</div>
			)}
			{isOwner && currentRound.status === RoundStatus.FINISHED && (
				<div>
					<button onClick={() => nextRound(game.id)}>
						Next Round
					</button>
				</div>
			)}
			{isGuesser && currentRound.status === RoundStatus.PENDING && (
				<div className={styles.startRoundContainer}>
					<button
						onClick={() => startRound(game.id)}
						className={styles.startGameButton}
						disabled={!isAllReady}
					>
						<Play fill="currentColor" size={20} /> Start Round
					</button>
				</div>
			)}
		</div>
	);
}
