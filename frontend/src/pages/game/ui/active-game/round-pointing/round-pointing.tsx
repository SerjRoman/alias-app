import styles from "./round-pointing.module.css";
import { useActiveGameActions } from "../../../api";
import type { WordState } from "@entities/game";
import { Plus, Minus } from "lucide-react";
import { Button } from "@shared/ui/button";

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
	const { endPointing, changeWordScore } = useActiveGameActions();
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
							<Button
								className={styles.scoreBtn}
								onClick={() => {
									changeWordScore(roomId, word.id, 1);
								}}
							>
								<Plus />
							</Button>
							<Button
								className={styles.scoreBtn}
								onClick={() => {
									changeWordScore(roomId, word.id, -1);
								}}
							>
								<Minus />
							</Button>
						</div>
					</div>
				))}
			</div>
			{isOwner && (
				<Button
					onClick={() => {
						endPointing(roomId);
					}}
					className={styles.nextRoundBtn}
				>
					End Pointing
				</Button>
			)}
		</div>
	);
}
