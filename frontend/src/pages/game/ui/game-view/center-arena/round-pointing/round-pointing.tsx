import { Check, Minus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { WordOutcome, WordState } from "@entities/game";
import { Button, Tooltip } from "@shared/ui";
import { useActiveGameActions } from "../../../../api";
import { WordEffectIcons } from "../word-effect-icons";
import styles from "./round-pointing.module.css";

export interface RoundPointingProps {
	roomId: string;
	words: WordState[];
	isOwner: boolean;
}

export function RoundPointing({
	roomId,
	words,
	isOwner,
}: Readonly<RoundPointingProps>) {
	const { t } = useTranslation();
	const { endPointing, changeWordOutcome } = useActiveGameActions();

	const roundPoints = words.reduce((acc, w) => acc + (w.score || 0), 0);

	const handleSetWordOutcome = (word: WordState, outcome: WordOutcome) => {
		if (word.outcome !== outcome) {
			changeWordOutcome(roomId, word.id, outcome);
		}
	};

	return (
		<div className={styles.stageSingle}>
			<div className={styles.feedCard}>
				<div className={styles.feedHeader}>
					<span className={styles.feedTitle}>
						{t("gameView.pointingTitle")}
					</span>

					<span
						className={`${styles.roundScoreTotal} ${
							roundPoints < 0 ? styles.negative : ""
						}`}
					>
						{roundPoints >= 0 ? `+${roundPoints}` : roundPoints}{" "}
						{t("gameView.pts")} ({words.length}{" "}
						{t("gameView.wordsShort")})
					</span>
				</div>

				<div className={`${styles.feedList} game-scroll`}>
					{words.length === 0 ? (
						<div className={styles.emptyState}>
							{t("gameView.noWordsInRound")}
						</div>
					) : (
						words.map((word) => {
							const isCorrect = word.outcome === "guessed";
							const isNeutral = word.outcome === "neutral";
							const isWrong = word.outcome === "skipped";

							return (
								<div key={word.id} className={styles.feedItem}>
									<div className={styles.feedWordGroup}>
										<span className={styles.feedWord}>
											{word.text}
										</span>
										<WordEffectIcons
											effectIds={word.appliedEffectIds}
											className={styles.effectIcons}
											badgeClassName={styles.effectBadge}
										/>
									</div>

									{isOwner ? (
										<div
											className={styles.statusToggleGroup}
											role="group"
											aria-label={`Validate ${word.text}`}
										>
											<button
												type="button"
												className={`${styles.statusToggleBtn} ${
													isCorrect
														? styles.activeCorrect
														: ""
												}`}
												onClick={() =>
													handleSetWordOutcome(
														word,
														"guessed",
													)
												}
												title={t("gameView.guessed")}
											>
												<Check size={12} />
												<span>
													{t("gameView.guessed")}
												</span>
											</button>

											<button
												type="button"
												className={`${styles.statusToggleBtn} ${
													isNeutral
														? styles.activeNeutral
														: ""
												}`}
												onClick={() =>
													handleSetWordOutcome(
														word,
														"neutral",
													)
												}
												title={t("gameView.neutral")}
											>
												<Minus size={12} />
												<span>
													{t("gameView.neutral")}
												</span>
											</button>

											<button
												type="button"
												className={`${styles.statusToggleBtn} ${
													isWrong
														? styles.activeWrong
														: ""
												}`}
												onClick={() =>
													handleSetWordOutcome(
														word,
														"skipped",
													)
												}
												title={t("gameView.wrong")}
											>
												<X size={12} />
												<span>
													{t("gameView.wrong")}
												</span>
											</button>
										</div>
									) : (
										<span
											className={`${styles.feedBadge} ${
												isCorrect
													? styles.correct
													: isNeutral
														? styles.neutral
														: styles.skipped
											}`}
										>
											{isCorrect ? (
												<>
													<Check size={12} />
													<span>+{word.score}</span>
												</>
											) : isNeutral ? (
												<>
													<Minus size={12} />
													<span>0</span>
												</>
											) : (
												<>
													<X size={12} />
													<span>{word.score}</span>
												</>
											)}
										</span>
									)}
								</div>
							);
						})
					)}
				</div>
			</div>

			{isOwner && (
				<div className={styles.footerActions}>
					<Tooltip text={t("tooltips.endPointing")} position="top">
						<Button
							type="button"
							variant="primary"
							size="large"
							onClick={() => endPointing(roomId)}
							className={styles.nextRoundBtn}
						>
							{t("activeGame.endPointing")}
						</Button>
					</Tooltip>
				</div>
			)}
		</div>
	);
}
