import { Check, X, Hourglass, Snowflake, Shuffle } from "lucide-react";
import type { WordState } from "@entities/game";
import styles from "./center-arena.module.css";

interface ExplainerViewProps {
	currentWordText: string;
	guessedWords: WordState[];
	onCorrect: () => void;
	onSkip: () => void;
	onPowerUp: (powerUpName: string) => void;
	isFogged?: boolean;
}

export function ExplainerView({
	currentWordText,
	guessedWords,
	onCorrect,
	onSkip,
	onPowerUp,
	isFogged = false,
}: Readonly<ExplainerViewProps>) {
	const roundPoints = guessedWords.reduce((acc, w) => acc + (w.score || 0), 0);

	return (
		<>
			<div className={styles.stageGrid}>
				{/* 1. Current Word Card */}
				<div className={`${styles.wordCard} ${isFogged ? styles.fogged : ""}`}>
					<span className={styles.wordBadge}>Current Word</span>
					<div className={styles.targetWord}>{currentWordText || "WAITING..."}</div>

					<div className={styles.actionButtons}>
						<button
							type="button"
							className={`${styles.btnAction} ${styles.btnSkip}`}
							onClick={onSkip}
							title="Skip word (-1 point penalty)"
						>
							<X size={20} />
							<span>Skip (-1)</span>
						</button>

						<button
							type="button"
							className={`${styles.btnAction} ${styles.btnCorrect}`}
							onClick={onCorrect}
							title="Word guessed correctly (+1 point)"
						>
							<Check size={20} />
							<span>Correct (+1)</span>
						</button>
					</div>
				</div>

				{/* 2. Round Guessed Words Feed */}
				<div className={styles.feedCard}>
					<div className={styles.feedHeader}>
						<span className={styles.feedTitle}>Round Words Feed</span>
						<span className={styles.roundScoreTotal}>
							{roundPoints >= 0 ? `+${roundPoints}` : roundPoints} pts
						</span>
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
										<span className={styles.feedWord}>{item.text}</span>
										<span
											className={`${styles.feedBadge} ${
												isCorrect ? styles.correct : styles.skipped
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

			{/* Bottom: 3 Inventory / Power-up Slots */}
			<div className={styles.bottomDock}>
				<div className={styles.inventoryGroup}>
					<span className={styles.inventoryLabel}>Power-Ups:</span>
					<button
						type="button"
						className={styles.powerUpSlot}
						onClick={() => onPowerUp("+10s Timer")}
						title="Add 10 seconds to current round timer"
					>
						<Hourglass size={15} color="#38bdf8" />
						<span>+10s Timer</span>
					</button>

					<button
						type="button"
						className={styles.powerUpSlot}
						onClick={() => onPowerUp("Freeze")}
						title="Freeze opponent bet predictions for 10s"
					>
						<Snowflake size={15} color="#60a5fa" />
						<span>Freeze</span>
					</button>

					<button
						type="button"
						className={styles.powerUpSlot}
						onClick={() => onPowerUp("Word Swap")}
						title="Swap difficult word without penalty"
					>
						<Shuffle size={15} color="#f59e0b" />
						<span>Word Swap</span>
					</button>
				</div>
			</div>
		</>
	);
}
