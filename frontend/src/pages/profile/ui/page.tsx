import { useState } from "react";
import styles from "./page.module.css";
import { useQuery } from "@shared/api";
import { useParams } from "react-router-dom";
import type {
	GameSummaryResponse,
	GameWordsLevel,
	ParticipantDisplayData,
} from "@entities/game";
import { useAuth } from "@entities/auth";

const GamesList = ({ games }: { games: GameSummaryResponse[] }) => {
	const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
	// const { data: roundsData } = useQuery(
	// 	"get",
	// 	"/history/games/{gameId}/rounds",
	// 	{
	// 		params: { path: { gameId: expandedGameId || "" } },
	// 	},
	// 	{
	// 		enabled: !!expandedGameId,
	// 	},
	// );
	const toggleGame = (gameId: string) => {
		setExpandedGameId((prev) => (prev === gameId ? null : gameId));
	};
	const selectedGame = games.find((g) => g.id === expandedGameId);
	const participants = selectedGame?.participants.reduce(
		(acc, participant) => {
			acc.set(participant.participantId, participant.displayData);
			return acc;
		},
		new Map<string, ParticipantDisplayData>(),
	);
	const teams = selectedGame?.teams.reduce((acc, team) => {
		acc.set(team.id, team.name);
		return acc;
	}, new Map<string, string>());
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
									Игра: {game.settings.name}
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
								<h4>Раунды:</h4>
								{game.roundsSummary.length > 0 ? (
									<ul className={styles.roundsList}>
										{game.roundsSummary.map((round) => (
											<li
												key={round.id}
												className={styles.roundItem}
											>
												<p>
													Раунд {round.roundNumber}:
												</p>
												<p>
													Команда{" "}
													{teams?.get(round.teamId) ||
														"Неизвестная команда"}
												</p>
												<p>
													Ведущий:{" "}
													{participants?.get(
														round.guesserParticipantId,
													)?.name || "Неизвестный"}
												</p>
											</li>
										))}
									</ul>
								) : (
									<p>Нет информации о раундах</p>
								)}
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
};

export const ProfilePage = () => {
	const { userId } = useParams<{ userId: string }>();
	const { token } = useAuth();
	const { data: user, isError } = useQuery(
		"get",
		"/user/{id}/profile",
		{
			params: { path: { id: userId || "" } },
		},
		{ enabled: !!userId },
	);

	const { data: gamesData, isLoading: isGamesLoading } = useQuery(
		"get",
		"/history/games/{userId}",
		{
			params: {
				query: { limit: 10, offset: 0 },
				path: { userId: userId || "" },
			},
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
		{
			enabled: !!userId,
			select: (data) => ({
				items: data.items.map((game) => ({
					...game,
					settings: {
						...game.settings,
						level: game.settings.level as GameWordsLevel,
					},
					participants: game.participants.map((p) => ({
						...p,
						displayData: {
							...p.displayData,
							userId: p.displayData.userId as string | null,
						},
					})),
				})),
				total: data.total,
			}),
		},
	);

	if (!userId) {
		return <div>Loading...</div>;
	}

	if (isError) {
		return <div>User not found</div>;
	}

	if (!user) {
		return <div>Loading user profile...</div>;
	}

	return (
		<div className={styles.container}>
			<header className={styles.header}>
				<img
					src={user.avatarUrl || "/default-avatar.png"}
					alt="Avatar"
					className={styles.avatar}
				/>
				<div className={styles.userInfo}>
					<h1 className={styles.name}>{user.name || "Без имени"}</h1>
					<p className={styles.username}>@{user.username}</p>
					<div className={styles.stats}>
						<span>Сыграно: {user.totalGamesPlayed}</span>
						<span>Побед: {user.totalWins}</span>
						<span>Очки: {user.totalScore}</span>
					</div>
				</div>
			</header>

			<main className={styles.content}>
				<h2>История игр</h2>
				{isGamesLoading ? (
					<p>Загрузка игр...</p>
				) : gamesData?.items && gamesData.items.length > 0 ? (
					<GamesList games={gamesData.items} />
				) : (
					<p>Вы еще не сыграли ни одной игры.</p>
				)}
			</main>
		</div>
	);
};
