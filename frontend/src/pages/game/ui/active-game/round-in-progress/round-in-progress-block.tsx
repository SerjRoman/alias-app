import { Timer } from "@shared/ui/timer";
import { useActiveGameActions } from "../../../api";
import styles from "./round-in-progress-block.module.css";
import { Check, X } from "lucide-react";
import { useGameSlice, useGameShortcuts, type WordState } from "@entities/game";
import { Button } from "@shared/ui/button";

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

	useGameShortcuts({
		onNextWord: isGuesser ? () => nextWord(roomId, false) : undefined,
		onSkipWord: isGuesser ? () => nextWord(roomId, true) : undefined,
	});

	return (
		<>
			<Timer endTime={endTime} />

			{isGuesser && (
				<div className={styles.wordCard}>
					<div className={styles.secretWord}>
						{currentWord?.text || "Loading..."}
					</div>
					<div className={styles.actionButtons}>
						<Button
							className={styles.btnSkip}
							onClick={() => nextWord(roomId, true)}
						>
							<X size={24} />
							<div>SKIP (-1)</div>
						</Button>
						<Button
							className={styles.btnNext}
							onClick={() => nextWord(roomId, false)}
						>
							<Check size={24} />
							<div>CORRECT (+1)</div>
						</Button>
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
