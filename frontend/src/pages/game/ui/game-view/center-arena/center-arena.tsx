import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import type { GameStateDetails, WordState, TeamState } from "@entities/game";
import type { ActiveBet } from "../../../api/game-stubs";
import { getDynamicTeamColor } from "../../../api/game-stubs";
import { ExplainerView } from "./explainer-view";
import { OpponentView } from "./opponent-view";
import styles from "./center-arena.module.css";

interface CenterArenaProps {
	game: GameStateDetails;
	viewMode: "explainer" | "opponent";
	activeBet: ActiveBet;
	onActionWord?: (word: WordState, isSkip: boolean) => void;
	onPowerUpTrigger?: (powerUpName: string) => void;
	onFoulReport?: () => void;
	onPlaceQuickBet?: (option: string, odds: number) => void;
}

const WORDS_POOL = [
	"SYNCHROPHAZOTRON",
	"KALEIDOSCOPE",
	"NEURODYNAMICS",
	"STRATOSPHERE",
	"SUPERCONDUCTOR",
	"CYBERNETICS",
	"METAMORPHOSIS",
	"ASTROPHYSICS",
	"ARCHAEOLOGIST",
	"QUANTUM FIELD",
];

export function CenterArena({
	game,
	viewMode,
	activeBet,
	onActionWord,
	onPowerUpTrigger,
	onFoulReport,
	onPlaceQuickBet,
}: Readonly<CenterArenaProps>) {
	// Active team info
	const activeTurnTeamId = game.currentRound?.teamId ?? game.teams[0]?.id;
	const activeTeam = game.teams.find((t) => t.id === activeTurnTeamId) ?? game.teams[0];
	const activeTeamIndex = game.teams.findIndex((t) => t.id === activeTurnTeamId);
	const activeTeamColor = getDynamicTeamColor(
		activeTeam as TeamState & { color?: string },
		Math.max(activeTeamIndex, 0),
	);

	// Word pool index
	const [wordIndex, setWordIndex] = useState(0);
	const [currentWordText, setCurrentWordText] = useState(
		game.currentRound?.currentWord?.text || WORDS_POOL[0],
	);

	// Round guessed/skipped words feed
	const [wordsFeed, setWordsFeed] = useState<WordState[]>(
		game.currentRound?.words || [
			{ id: "w-1", text: "SUPERNOVA", score: 1 },
			{ id: "w-2", text: "ALGORITHM", score: 1 },
			{ id: "w-3", text: "SUBMARINE", score: -1 },
			{ id: "w-4", text: "TELESCOPE", score: 1 },
			{ id: "w-5", text: "QUANTUM", score: 1 },
		],
	);

	// Interactive timer (38 seconds default)
	const [remainingSeconds, setRemainingSeconds] = useState(38);
	const [isFogged, setIsFogged] = useState(false);

	useEffect(() => {
		const interval = setInterval(() => {
			setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
		}, 1000);
		return () => clearInterval(interval);
	}, []);

	// Format seconds to mm:ss
	const minutes = Math.floor(remainingSeconds / 60);
	const seconds = remainingSeconds % 60;
	const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
		seconds,
	).padStart(2, "0")}`;

	const isDanger = remainingSeconds <= 10;
	const isWarning = remainingSeconds <= 20 && !isDanger;
	const barPercentage = Math.min((remainingSeconds / 60) * 100, 100);

	// Handle Word Correct
	const handleCorrect = () => {
		const wordItem: WordState = {
			id: `word-${Date.now()}`,
			text: currentWordText,
			score: 1,
		};
		setWordsFeed((prev) => [wordItem, ...prev]);
		onActionWord?.(wordItem, false);

		// Advance to next word
		const nextIdx = (wordIndex + 1) % WORDS_POOL.length;
		setWordIndex(nextIdx);
		setCurrentWordText(WORDS_POOL[nextIdx]);
	};

	// Handle Word Skip
	const handleSkip = () => {
		const wordItem: WordState = {
			id: `word-${Date.now()}`,
			text: currentWordText,
			score: -1,
		};
		setWordsFeed((prev) => [wordItem, ...prev]);
		onActionWord?.(wordItem, true);

		// Advance to next word
		const nextIdx = (wordIndex + 1) % WORDS_POOL.length;
		setWordIndex(nextIdx);
		setCurrentWordText(WORDS_POOL[nextIdx]);
	};

	// Handle Power-Ups
	const handlePowerUp = (powerUpName: string) => {
		if (powerUpName === "+10s Timer") {
			setRemainingSeconds((prev) => Math.min(prev + 10, 60));
		}
		if (powerUpName === "Word Swap") {
			const nextIdx = (wordIndex + 1) % WORDS_POOL.length;
			setWordIndex(nextIdx);
			setCurrentWordText(WORDS_POOL[nextIdx]);
		}
		onPowerUpTrigger?.(powerUpName);
	};

	// Handle Sabotage
	const handleSabotage = (sabotageName: string) => {
		if (sabotageName === "Reduce timer -5s") {
			setRemainingSeconds((prev) => Math.max(prev - 5, 0));
		}
		if (sabotageName === "Fog word") {
			setIsFogged(true);
			setTimeout(() => setIsFogged(false), 3000);
		}
		onPowerUpTrigger?.(sabotageName);
	};

	return (
		<main className={styles.arena}>
			{/* Top Countdown Timer & Round Subtitle */}
			<div className={styles.timerSection}>
				<div
					className={`${styles.timerDisplay} ${
						isDanger ? styles.danger : isWarning ? styles.warning : ""
					}`}
				>
					<Clock size={28} />
					<span>{formattedTime}</span>
				</div>

				<div className={styles.timerBarContainer}>
					<div
						className={`${styles.timerBarFill} ${
							isDanger ? styles.danger : isWarning ? styles.warning : ""
						}`}
						style={{ width: `${barPercentage}%` }}
					/>
				</div>

				<div className={styles.subtitle}>
					{viewMode === "explainer" ? (
						<span>⚡ Your team is guessing! Speak clearly without cognates.</span>
					) : (
						<span>
							<span
								style={{
									display: "inline-block",
									width: 8,
									height: 8,
									borderRadius: "50%",
									background: activeTeamColor,
									marginRight: 6,
								}}
							/>
							{activeTeam?.name ?? "Active Team"} is explaining...
						</span>
					)}
				</div>
			</div>

			{/* Dynamic View Mode Split */}
			{viewMode === "explainer" ? (
				<ExplainerView
					currentWordText={currentWordText}
					guessedWords={wordsFeed}
					onCorrect={handleCorrect}
					onSkip={handleSkip}
					onPowerUp={handlePowerUp}
					isFogged={isFogged}
				/>
			) : (
				<OpponentView
					activeTeamName={activeTeam?.name ?? "Opponent"}
					activeTeamColor={activeTeamColor}
					guessedWords={wordsFeed}
					activeBet={activeBet}
					onReportFoul={() => onFoulReport?.()}
					onPlaceQuickBet={(opt, odds) => onPlaceQuickBet?.(opt, odds)}
					onUseSabotage={handleSabotage}
				/>
			)}
		</main>
	);
}
