import { Check, X } from "lucide-react";
import type { WordState } from "@entities/game";
import { Button } from "@shared/ui";
import styles from "./explainer-view.module.css";

interface ExplainerViewProps {
	currentWordText: string;
	guessedWords: WordState[];
	onCorrect: () => void;
	onSkip: () => void;
}

export function ExplainerView({
	currentWordText,
	guessedWords,
	onCorrect,
	onSkip,
}: Readonly<ExplainerViewProps>) {
	const roundPoints = guessedWords.reduce(
		(acc, w) => acc + (w.score || 0),
		0,
	);

	return (
		<div className={styles.stageGrid}>
			<div className={styles.wordCard}>
				<div className={styles.targetWord}>
					{currentWordText || "WAITING..."}
				</div>

				<div className={styles.actionButtons}>
					<Button
						type="button"
						variant="primary"
						size="large"
						className={`${styles.btnAction} ${styles.btnSkip}`}
						onClick={onSkip}
						title="Skip word"
					>
						<X size={20} />
						<span>Skip</span>
					</Button>

					<Button
						type="button"
						variant="primary"
						size="large"
						className={`${styles.btnAction} ${styles.btnCorrect}`}
						onClick={onCorrect}
						title="Word guessed correctly"
					>
						<Check size={20} />
						<span>Correct</span>
					</Button>
				</div>
			</div>

			<div className={styles.feedCard}>
				<div className={styles.feedHeader}>
					<span className={styles.feedTitle}>Round Words Feed</span>

					<div className={styles.feedHeaderActions}>
						<span
							className={`${styles.roundScoreTotal} ${roundPoints >= 0 ? styles.positive : styles.negative}`}
						>
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
							No words scored yet this turn. Explain the word!
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
											<Check size={12} />
										) : (
											<X size={12} />
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
