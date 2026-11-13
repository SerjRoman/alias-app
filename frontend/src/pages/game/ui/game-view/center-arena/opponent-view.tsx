import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { useGameSlice, type WordState } from "@entities/game";
import { Avatar } from "../avatar";
import styles from "./opponent-view.module.css";

interface OpponentViewProps {
	guessedWords: WordState[];
}

const TEAM_FALLBACK_COLORS = ["#f43f5e", "#0ea5e9", "#10b981", "#f59e0b"];

export function OpponentView({ guessedWords }: Readonly<OpponentViewProps>) {
	const { t } = useTranslation();
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

	const roundPoints = guessedWords.reduce(
		(acc, w) => acc + (w.score || 0),
		0,
	);

	return (
		<div className={styles.stageSingle}>
			{explainer && activeTeam && (
				<div className={styles.liveTurnBanner}>
					<div className={styles.liveTurnLeft}>
						<span className={styles.livePulseDot} />
						<Avatar name={explainer.name} size={32} />
						<div className={styles.liveTurnText}>
							<span className={styles.liveTurnLabel}>
								{t("gameView.explainingNow")}
							</span>
							<span className={styles.liveTurnName}>
								{explainer.name}
							</span>
						</div>
					</div>
					<span
						className={styles.liveTeamBadge}
						style={{
							borderColor: `${teamColor}66`,
							backgroundColor: `${teamColor}22`,
							color: teamColor,
						}}
					>
						{activeTeam.name}
					</span>
				</div>
			)}

			<div className={styles.feedCard}>
				<div className={styles.feedHeader}>
					<span className={styles.feedTitle}>
						{t("gameView.roundWordsFeed")}
					</span>

					<div className={styles.feedHeaderActions}>
						<span className={styles.roundScoreTotal}>
							{roundPoints >= 0 ? `+${roundPoints}` : roundPoints}{" "}
							{t("gameView.pts")} ({guessedWords.length}{" "}
							{t("gameView.wordsShort")})
						</span>
					</div>
				</div>

				<div className={`${styles.feedList} game-scroll`}>
					{guessedWords.length === 0 ? (
						<div className={styles.emptyFeed}>
							{t("gameView.noWordsYet")}
						</div>
					) : (
						guessedWords.map((item) => {
							const isCorrect = item.score > 0;
							return (
								<div key={item.id} className={styles.feedItem}>
									<span className={styles.feedWord}>
										{item.text}
									</span>
									<span
										className={`${styles.feedBadge} ${
											isCorrect
												? styles.correct
												: styles.skipped
										}`}
									>
										{isCorrect ? (
											<>
												<Check size={12} />
												<span>+1</span>
											</>
										) : (
											<>
												<X size={12} />
												<span>-1</span>
											</>
										)}
									</span>
								</div>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
}
