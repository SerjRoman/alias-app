import { Check, Minus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGameShortcuts, type WordState } from "@entities/game";
import { Button, Tooltip } from "@shared/ui";
import { useActiveGameActions } from "../../../../api";
import { WordEffectIcons } from "../word-effect-icons";
import styles from "./round-finished-results.module.css";

export interface RoundFinishedResultsProps {
	roomId: string;
	words: WordState[];
	isOwner: boolean;
}

export function RoundFinishedResults({
	roomId,
	words,
	isOwner,
}: Readonly<RoundFinishedResultsProps>) {
	const { t } = useTranslation();
	const { nextRound } = useActiveGameActions();

	useGameShortcuts({
		onNextRound: isOwner ? () => nextRound(roomId) : undefined,
	});

	const roundPoints = words.reduce((acc, w) => acc + (w.score || 0), 0);

	return (
		<div className={styles.stageSingle}>
			<div className={styles.feedCard}>
				<div className={styles.feedHeader}>
					<span className={styles.feedTitle}>
						{t("gameView.roundFinishedTitle")}
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
							const isCorrect = word.score > 0;
							const isNeutral = word.score === 0;

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
								</div>
							);
						})
					)}
				</div>
			</div>

			{isOwner && (
				<div className={styles.footerActions}>
					<Tooltip text={t("tooltips.nextRound")} position="top">
						<Button
							type="button"
							variant="primary"
							size="large"
							onClick={() => nextRound(roomId)}
							className={styles.nextRoundBtn}
						>
							{t("activeGame.nextRound")}
						</Button>
					</Tooltip>
				</div>
			)}
		</div>
	);
}
