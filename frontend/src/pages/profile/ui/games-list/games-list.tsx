import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useModal } from "@shared/lib/hooks";
import type { GameSummaryResponse, ParticipantDisplayData } from "@entities/game";
import { RoundDetailsModal, type RoundDetailsModalProps } from "../round-details-modal/round-details-modal";
import styles from "./games-list.module.css";

interface GamesListProps {
	games: GameSummaryResponse[];
}

export function GamesList({ games }: Readonly<GamesListProps>) {
	const { t } = useTranslation();
	const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

	const [modalControl, ModalProvider] = useModal<
		Omit<RoundDetailsModalProps, "isOpen" | "onClose">
	>();

	const toggleGame = (gameId: string) => {
		setExpandedGameId((prev) => (prev === gameId ? null : gameId));
	};

	// Build complete mappings for participants and teams from all games to support lookups in the details modal
	const allParticipants = games.reduce((acc, game) => {
		game.participants.forEach((p) => {
			acc.set(p.participantId, p.displayData);
		});
		return acc;
	}, new Map<string, ParticipantDisplayData>());

	const allTeams = games.reduce((acc, game) => {
		game.teams.forEach((t) => {
			acc.set(t.id, t.name);
		});
		return acc;
	}, new Map<string, string>());

	const selectedGame = games.find((g) => g.id === expandedGameId);
	const currentParticipants = selectedGame?.participants.reduce(
		(acc, participant) => {
			acc.set(participant.participantId, participant.displayData);
			return acc;
		},
		new Map<string, ParticipantDisplayData>(),
	);
	const currentTeams = selectedGame?.teams.reduce((acc, team) => {
		acc.set(team.id, team.name);
		return acc;
	}, new Map<string, string>());

	const handleRoundClick = (roundId: string) => {
		modalControl.open({
			roundId,
			teamsMap: allTeams,
			participantsMap: allParticipants,
		});
	};

	return (
		<div className={styles.gamesList}>
			{games.map((game) => {
				const isExpanded = expandedGameId === game.id;
				return (
					<div key={game.id} className={styles.gameCard}>
						<div
							className={styles.gameHeader}
							onClick={() => toggleGame(game.id)}
						>
							<div className={styles.gameMainInfo}>
								<span className={styles.gameName}>
									{t("profile.game", { name: game.settings.name })}
								</span>
								<span className={styles.gameDate}>
									{new Date(game.createdAt).toLocaleString()}
								</span>
							</div>
							<span className={styles.expandIcon}>
								{isExpanded ? "▲" : "▼"}
							</span>
						</div>

						{isExpanded && (
							<div className={styles.gameDetails}>
								<h4>{t("profile.rounds")}</h4>
								{game.roundsSummary.length > 0 ? (
									<ul className={styles.roundsList}>
										{game.roundsSummary.map((round) => (
											<li
												key={round.id}
												className={styles.roundItem}
												onClick={() => handleRoundClick(round.id)}
											>
												<p>
													{t("profile.round", { number: round.roundNumber })}
												</p>
												<p>
													{t("profile.team", {
														name: currentTeams?.get(round.teamId) ?? t("profile.unknownTeam"),
													})}
												</p>
												<p>
													{t("profile.host", {
														name: currentParticipants?.get(round.guesserParticipantId)?.name ?? t("profile.unknownHost"),
													})}
												</p>
											</li>
										))}
									</ul>
								) : (
									<p>{t("profile.noRounds")}</p>
								)}
							</div>
						)}
					</div>
				);
			})}

			<ModalProvider ModalComponent={RoundDetailsModal} />
		</div>
	);
}
