import type { WordState } from "@entities/game/model";
import styles from "./round-finished-results.module.css";
import { Minus, Plus } from "lucide-react";
import { useActiveGameActions } from "../../model/use-active-game-actions";

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
	const { changeWordScore, nextRound } = useActiveGameActions();
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
							<button
								className={styles.scoreBtn}
								onClick={() => {
									changeWordScore(roomId, word.id, 1);
								}}
							>
								<Plus />
							</button>
							<button
								className={styles.scoreBtn}
								onClick={() => {
									changeWordScore(roomId, word.id, -1);
								}}
							>
								<Minus />
							</button>
						</div>
					</div>
				))}
			</div>
			{isOwner && (
				<button
					onClick={() => {
						nextRound(roomId);
					}}
					className={styles.nextRoundBtn}
				>
					Next Round
				</button>
			)}
		</div>
	);
}
