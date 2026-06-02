import { Modal } from "@shared/ui/modal";
import { useQuery, translateApiError } from "@shared/api";
import { X, Check, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import styles from "./round-details-modal.module.css";
import type { ParticipantDisplayData } from "@entities/game";

export interface RoundDetailsModalProps {
	isOpen: boolean;
	onClose: () => void;
	roundId: string | null;
	teamsMap: Map<string, string> | undefined;
	participantsMap: Map<string, ParticipantDisplayData> | undefined;
}

export function RoundDetailsModal({
	isOpen,
	onClose,
	roundId,
	teamsMap,
	participantsMap,
}: Readonly<RoundDetailsModalProps>) {
	const { t } = useTranslation();

	const { data: round, isLoading, error } = useQuery(
		"get",
		"/history/rounds/{roundId}",
		{
			params: { path: { roundId: roundId ?? "" } },
		},
		{
			enabled: !!roundId && isOpen,
		},
	);

	if (!isOpen) return null;

	const roundNumber = round?.number;
	const totalScore = round?.words.reduce((sum, word) => sum + word.score, 0) ?? 0;
	const errorMessage = error
		? translateApiError(t, error, { fallback: "profile.roundDetails.error" })
		: null;

	const statsByTeam = new Map<string, NonNullable<typeof round>["participantsStats"]>();
	if (round?.participantsStats) {
		round.participantsStats.forEach((stat) => {
			const list = statsByTeam.get(stat.teamId) || [];
			list.push(stat);
			statsByTeam.set(stat.teamId, list);
		});
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			doCloseOnClickOutside
			className={styles.modalContainer}
		>
			<div className={styles.header}>
				<h3 className={styles.title}>
					{isLoading
						? t("profile.roundDetails.loading")
						: t("profile.roundDetails.title", { number: roundNumber })}
				</h3>
				<button onClick={onClose} className={styles.closeButton} aria-label="Close">
					<X size={20} />
				</button>
			</div>

			<div className={styles.content}>
				{isLoading && <div className={styles.loader}>{t("profile.roundDetails.loading")}</div>}
				{errorMessage && <div className={styles.error}>{errorMessage}</div>}

				{round && (
					<>
						<div className={styles.summarySection}>
							<div className={styles.summaryItem}>
								<span className={styles.summaryLabel}>{t("profile.roundDetails.score")}</span>
								<span className={`${styles.summaryValue} ${totalScore >= 0 ? styles.positiveScore : styles.negativeScore}`}>
									{totalScore > 0 ? `+${totalScore}` : totalScore}
								</span>
							</div>
						</div>

						<div className={styles.section}>
							<h4>{t("profile.roundDetails.playerStats")}</h4>
							<div className={styles.teamsGrid}>
								{Array.from(statsByTeam.entries()).map(([teamId, stats]) => {
									const teamName = teamsMap?.get(teamId) ?? t("profile.unknownTeam");
									const isActiveTeam = teamId === round.teamId;

									return (
										<div key={teamId} className={`${styles.teamBlock} ${isActiveTeam ? styles.activeTeamBlock : ""}`}>
											<div className={styles.teamBlockHeader}>
												<span className={styles.teamBlockTitle}>{teamName}</span>
												{isActiveTeam && (
													<span className={styles.playingBadge}>
														{t("profile.roundDetails.activeTeamBadge")}
													</span>
												)}
											</div>
											<ul className={styles.statsList}>
												{stats.map((stat) => {
													const participantName = participantsMap?.get(stat.participantId)?.name ?? t("profile.unknownHost");
													const isHost = stat.participantId === round.guesserId;

													return (
														<li key={stat.participantId} className={styles.statItem}>
															<div className={styles.playerInfo}>
																<div className={styles.playerNameWrapper}>
																	<span className={styles.playerName}>{participantName}</span>
																	{isHost && (
																		<span className={styles.hostBadge}>
																			<Crown size={12} fill="currentColor" />
																			{t("profile.roundDetails.hostBadge")}
																		</span>
																	)}
																</div>
															</div>
															<span className={styles.playerScore}>
																{t("profile.roundDetails.points", { count: stat.scoreAfterRound })}
															</span>
														</li>
													);
												})}
											</ul>
										</div>
									);
								})}
							</div>
						</div>

						<div className={styles.section}>
							<h4>{t("profile.roundDetails.wordsInRound", { count: round.words.length })}</h4>
							{round.words.length > 0 ? (
								<ul className={styles.wordsList}>
									{round.words.map((word) => {
										const isGuessed = word.score > 0;
										return (
											<li key={word.id} className={`${styles.wordItem} ${isGuessed ? styles.guessed : styles.skipped}`}>
												<div className={styles.wordMain}>
													{isGuessed ? (
														<Check size={16} className={styles.guessedIcon} />
													) : (
														<X size={16} className={styles.skippedIcon} />
													)}
													<span className={styles.wordText}>{word.text}</span>
												</div>
												<span className={styles.wordScore}>
													{isGuessed ? `+${word.score}` : word.score}
												</span>
											</li>
										);
									})}
								</ul>
							) : (
								<p className={styles.noWords}>{t("profile.roundDetails.noWords")}</p>
							)}
						</div>
					</>
				)}
			</div>
		</Modal>
	);
}
