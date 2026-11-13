import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import type { WordState } from "@entities/game";
import { Button } from "@shared/ui";
import styles from "./explainer-view.module.css";

interface ExplainerViewProps {
	currentWordText: string;
	guessedWords: WordState[];
	isWordFlipped?: boolean;
	isFrozen?: boolean;
	onCorrect: () => void;
	onSkip: () => void;
}

export function ExplainerView({
	currentWordText,
	guessedWords,
	isWordFlipped = false,
	isFrozen = false,
	onCorrect,
	onSkip,
}: Readonly<ExplainerViewProps>) {
	const { t } = useTranslation();
	const roundPoints = guessedWords.reduce(
		(acc, w) => acc + (w.score || 0),
		0,
	);

	return (
		<div className={styles.stageGrid}>
			<div
				className={`${styles.wordCard} ${isFrozen ? styles.frozenCard : ""}`}
			>
				<div
					key={currentWordText || "waiting"}
					className={styles.wordPopWrapper}
				>
					<div
						className={`${styles.targetWord} ${isWordFlipped ? styles.flippedWord : ""}`}
					>
						{currentWordText || t("gameView.waitingWord")}
					</div>
				</div>

				<div className={styles.actionButtons}>
					<Button
						type="button"
						variant="primary"
						size="large"
						disabled={isFrozen}
						className={`${styles.btnAction} ${styles.btnSkip}`}
						onClick={onSkip}
						title={`${t("gameView.skipWord")} (E)`}
					>
						<X size={20} />
						<span>{t("gameView.skipWord")}</span>
						<kbd className={styles.kbdHint}>E</kbd>
					</Button>

					<Button
						type="button"
						variant="primary"
						size="large"
						disabled={isFrozen}
						className={`${styles.btnAction} ${styles.btnCorrect}`}
						onClick={onCorrect}
						title={`${t("gameView.correctWord")} (Q)`}
					>
						<Check size={20} />
						<span>{t("gameView.correctWord")}</span>
						<kbd className={styles.kbdHint}>Q</kbd>
					</Button>
				</div>
			</div>

			<div className={styles.feedCard}>
				<div className={styles.feedHeader}>
					<span className={styles.feedTitle}>
						{t("gameView.roundWordsFeed")}
					</span>

					<div className={styles.feedHeaderActions}>
						<span
							className={`${styles.roundScoreTotal} ${roundPoints >= 0 ? styles.positive : styles.negative}`}
						>
							{roundPoints >= 0 ? `+${roundPoints}` : roundPoints}{" "}
							{t("gameView.pts")} ({guessedWords.length}{" "}
							{t("gameView.wordsShort")})
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
