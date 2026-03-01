import { useGameSlice, type WordState } from "@entities/game/model";
import { Timer } from "@shared/ui/timer";
import { useActiveGameActions } from "../../model/use-active-game-actions";
import styles from "./round-in-progress-block.module.css";
import { Check, X } from "lucide-react";

interface Props {
	roomId: string;
	isGuesser: boolean;
	endTime: number;
	words: WordState[];
}

export function RoundInProgressBlock({
	roomId,
	isGuesser,
	endTime,
	words,
}: Readonly<Props>) {
	const { currentWord } = useGameSlice();
	const { nextWord } = useActiveGameActions();

	return (
		<>
			<Timer endTime={endTime} />

			{isGuesser && (
				<div className={styles.wordCard}>
					<div className={styles.secretWord}>
						{currentWord?.text || "Loading..."}
					</div>
					<div className={styles.actionButtons}>
						<button
							className={styles.btnSkip}
							onClick={() => nextWord(roomId, true)}
						>
							<X size={24} />
							<div>SKIP (-1)</div>
						</button>
						<button
							className={styles.btnNext}
							onClick={() => nextWord(roomId, false)}
						>
							<Check size={24} />
							<div>CORRECT (+1)</div>
						</button>
					</div>
				</div>
			)}
			<div className={styles.wordList}>
				{words.map((w) => (
					<div key={w.id} className={styles.wordItem}>
						{w.text}
					</div>
				))}
			</div>
		</>
	);
}
