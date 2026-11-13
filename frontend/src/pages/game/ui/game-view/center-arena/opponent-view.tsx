import { Check, X } from "lucide-react";
import type { WordState } from "@entities/game";
import styles from "./opponent-view.module.css";

interface OpponentViewProps {
	guessedWords: WordState[];
}

export function OpponentView({ guessedWords }: Readonly<OpponentViewProps>) {
	const roundPoints = guessedWords.reduce(
		(acc, w) => acc + (w.score || 0),
		0,
	);

	return (
		<div className={styles.stageSingle}>
			<div className={styles.feedCard}>
				<div className={styles.feedHeader}>
					<span className={styles.feedTitle}>Round Words Feed</span>

					<div className={styles.feedHeaderActions}>
						<span className={styles.roundScoreTotal}>
							{roundPoints >= 0 ? `+${roundPoints}` : roundPoints}{" "}
							pts ({guessedWords.length} words)
						</span>
					</div>
				</div>

				<div className={`${styles.feedList} game-scroll`}>
					{guessedWords.length === 0 ? (
						<div
							style={{
								textAlign: "center",
								padding: "24px 12px",
								color: "var(--game-text-muted, #64748b)",
								fontSize: "12px",
							}}
						>
							No words scored yet this round.
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
