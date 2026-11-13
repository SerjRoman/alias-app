import React from "react";
import {
	Lock,
	AlertTriangle,
	Check,
	X,
	Bomb,
	CloudRain,
	Coins,
} from "lucide-react";
import type { WordState } from "@entities/game";
import type { ActiveBet } from "../../../api/game-stubs";
import styles from "./center-arena.module.css";

interface OpponentViewProps {
	activeTeamName: string;
	activeTeamColor?: string;
	guessedWords: WordState[];
	activeBet: ActiveBet;
	onReportFoul: () => void;
	onPlaceQuickBet: (option: string, odds: number) => void;
	onUseSabotage: (sabotageName: string) => void;
}

export function OpponentView({
	activeTeamName,
	activeTeamColor = "#ef4444",
	guessedWords,
	activeBet,
	onReportFoul,
	onPlaceQuickBet,
	onUseSabotage,
}: Readonly<OpponentViewProps>) {
	const currentGuessedCount = guessedWords.filter((w) => w.score > 0).length;

	return (
		<>
			<div className={styles.stageGrid}>
				{/* 1. Hidden Word Card */}
				<div
					className={styles.hiddenCard}
					style={{ "--team-color": activeTeamColor } as React.CSSProperties}
				>
					<div className={styles.lockIconWrapper}>
						<Lock size={32} />
					</div>

					<div className={styles.hiddenWordTitle}>Word is Hidden</div>
					<div className={styles.hiddenWordDesc}>
						Listening to {activeTeamName} explainer. Stay alert for cognates or rule
						violations!
					</div>

					{/* Soundwave animation */}
					<div className={styles.soundwaveVisualizer}>
						<span
							className={styles.soundwaveStick}
							style={{ animationDelay: "0.1s" }}
						/>
						<span
							className={styles.soundwaveStick}
							style={{ animationDelay: "0.3s" }}
						/>
						<span
							className={styles.soundwaveStick}
							style={{ animationDelay: "0.5s" }}
						/>
						<span
							className={styles.soundwaveStick}
							style={{ animationDelay: "0.2s" }}
						/>
						<span
							className={styles.soundwaveStick}
							style={{ animationDelay: "0.4s" }}
						/>
						<span
							className={styles.soundwaveStick}
							style={{ animationDelay: "0.6s" }}
						/>
						<span
							className={styles.soundwaveStick}
							style={{ animationDelay: "0.15s" }}
						/>
					</div>

					{/* Report Foul Button */}
					<button
						type="button"
						className={styles.btnChallenge}
						onClick={onReportFoul}
						title="Dispute cognate root or rule infraction"
					>
						<AlertTriangle size={16} />
						<span>Report Foul / Cognate Rule Violation</span>
					</button>
				</div>

				{/* 2. Live Guessed Words Feed */}
				<div className={styles.feedCard}>
					<div className={styles.feedHeader}>
						<span className={styles.feedTitle}>
							{activeTeamName} Turn Progress
						</span>
						<span className={styles.roundScoreTotal}>
							{guessedWords.length} Words Played
						</span>
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
								{activeTeamName} has not scored words yet this round.
							</div>
						) : (
							guessedWords.map((item) => {
								const isCorrect = item.score > 0;
								return (
									<div key={item.id} className={styles.feedItem}>
										<span className={styles.feedWord}>{item.text}</span>
										<span
											className={`${styles.feedBadge} ${
												isCorrect ? styles.correct : styles.skipped
											}`}
										>
											{isCorrect ? (
												<>
													<Check size={12} />
													<span>+1</span>
												</>
											) : (
												<>
													<X size={12} />
													<span>-1</span>
												</>
											)}
										</span>
									</div>
								);
							})
						)}
					</div>
				</div>
			</div>

			{/* Bottom: Live Betting Widget & Sabotage Items */}
			<div className={styles.bottomDock}>
				<div className={styles.bettingWidget}>
					{/* Active Bet Status */}
					<div className={styles.betStatusBox}>
						<Coins size={15} />
						<span>
							Your bet: {activeBet.amount} coins on &apos;{activeBet.optionText}&apos; [x
							{activeBet.odds}] &rarr; Status:{" "}
							<strong style={{ color: "#10b981" }}>
								Winning! ({currentGuessedCount} words)
							</strong>
						</span>
					</div>

					{/* Quick Bets */}
					<div className={styles.quickBets}>
						<button
							type="button"
							className={styles.btnBetOption}
							onClick={() => onPlaceQuickBet("< 6 words", 1.85)}
						>
							&lt; 6 words [1.85x]
						</button>
						<button
							type="button"
							className={styles.btnBetOption}
							onClick={() => onPlaceQuickBet("6-9 words", 2.1)}
						>
							6-9 words [2.10x]
						</button>
						<button
							type="button"
							className={styles.btnBetOption}
							onClick={() => onPlaceQuickBet("10+ words", 3.5)}
						>
							10+ words [3.50x]
						</button>
					</div>

					{/* Sabotage items */}
					<div className={styles.inventoryGroup}>
						<button
							type="button"
							className={styles.powerUpSlot}
							onClick={() => onUseSabotage("Reduce timer -5s")}
							title="Sabotage: deduct 5 seconds from active team"
						>
							<Bomb size={14} color="#ef4444" />
							<span>-5s Timer</span>
						</button>
						<button
							type="button"
							className={styles.powerUpSlot}
							onClick={() => onUseSabotage("Fog word")}
							title="Sabotage: obscure explainer card for 3 seconds"
						>
							<CloudRain size={14} color="#a855f7" />
							<span>Fog Word</span>
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
