import styles from "./round-finished-results.module.css";
import { useActiveGameActions } from "../../../api";
import { useGameShortcuts, type WordState } from "@entities/game";
import { Button, Tooltip } from "@shared/ui";
import { useTranslation } from "react-i18next";

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

	const scoreColor = (score: number) => {
		if (score > 0) return "#5fca78";
		if (score < 0) return "#e57373";
		return "#eee";
	};
	return (
		<div className={styles.container}>
			<div className={styles.wordList}>
				{words.map((word) => (
					<div key={word.id} className={styles.wordItem}>
						<span>{word.text}</span>
						<div className={styles.scoreControls}>
							<span
								className={styles.score}
								style={{
									backgroundColor: scoreColor(word.score),
								}}
							>
								{word.score}
							</span>
						</div>
					</div>
				))}
			</div>
			{isOwner && (
				<Tooltip text={t("tooltips.nextRound")} position="top">
					<Button
						onClick={() => {
							nextRound(roomId);
						}}
						className={styles.nextRoundBtn}
					>
						{t("activeGame.nextRound")}
					</Button>
				</Tooltip>
			)}
		</div>
	);
}
