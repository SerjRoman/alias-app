import type { WordState } from "@entities/game/model";
import styles from "./round-finished-results.module.css";
import { Minus, Plus } from "lucide-react";
import { socketClient } from "@shared/api/socket";

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
									socketClient.emit("changeWordScore", {
										roomId,
										wordId: word.id,
										delta: 1,
									});
								}}
							>
								<Plus />
							</button>
							<button
								className={styles.scoreBtn}
								onClick={() => {
									socketClient.emit("changeWordScore", {
										roomId,
										wordId: word.id,
										delta: -1,
									});
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
						socketClient.emit("nextRound", { roomId });
					}}
					className={styles.nextRoundBtn}
				>
					Next Round
				</button>
			)}
		</div>
	);
}
