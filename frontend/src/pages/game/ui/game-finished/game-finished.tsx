import { useNavigate } from "react-router-dom";
import { socketClient } from "@shared/api";
import { useAuth } from "@entities/auth";
import { useGameSlice } from "@entities/game";
import { Button } from "@shared/ui";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Trophy, Medal } from "lucide-react";
import styles from "./game-finished.module.css";

export function GameFinished() {
	const { t } = useTranslation();
	const { user } = useAuth();
	const { game } = useGameSlice();
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	function handleLeaveGame() {
		if (game?.id) {
			socketClient.emit("leaveGame", { roomId: game.id });
		}
		queryClient.invalidateQueries({
			queryKey: ["get", "/games/current"],
		});
		navigate("/games");
	}

	if (!game || !user) {
		handleLeaveGame();
		return null;
	}

	const sortedTeams = [...(game.teams ?? [])].sort(
		(a, b) => b.score - a.score,
	);
	const topThree = sortedTeams.slice(0, 3);
	const remainingTeams = sortedTeams.slice(3);

	const getTeamMvp = (playerIds: string[]) => {
		const teamPlayers = (game.players ?? []).filter((p) =>
			playerIds.includes(p.id),
		);
		if (teamPlayers.length === 0) return null;
		return teamPlayers.reduce(
			(maxPlayer, p) => {
				if (!maxPlayer) return p;
				return p.score > maxPlayer.score ? p : maxPlayer;
			},
			null as (typeof game.players)[0] | null,
		);
	};

	const podiumList = [];
	if (topThree.length >= 2) podiumList.push({ team: topThree[1], place: 2 });
	if (topThree.length >= 1) podiumList.push({ team: topThree[0], place: 1 });
	if (topThree.length >= 3) podiumList.push({ team: topThree[2], place: 3 });

	const renderPlaceIcon = (place: number) => {
		if (place === 1) return <Trophy className={styles.firstIcon} size={48} />;
		if (place === 2) return <Medal className={styles.secondIcon} size={44} />;
		return <Medal className={styles.thirdIcon} size={40} />;
	};

	const getPlaceClassName = (place: number) => {
		if (place === 1) return styles.firstPlace;
		if (place === 2) return styles.secondPlace;
		return styles.thirdPlace;
	};

	return (
		<div className={styles.container}>
			<div className={styles.header}>
				<h1 className={styles.title}>{t("gameFinished.title")}</h1>
				<p className={styles.description}>
					{t("gameFinished.description")}
				</p>
			</div>

			{podiumList.length > 0 && (
				<div className={styles.podiumContainer}>
					{podiumList.map(({ team, place }) => {
						const mvp = getTeamMvp(team.playerIds);
						return (
							<div
								key={team.id}
								className={`${styles.podiumCard} ${getPlaceClassName(place)}`}
							>
								<div className={styles.badgeContainer}>
									<span className={styles.placeIconWrapper}>
										{renderPlaceIcon(place)}
									</span>
									<span className={styles.placeNumber}>
										{place}
									</span>
								</div>
								<h3 className={styles.teamName}>{team.name}</h3>
								<div className={styles.teamScore}>
									<span className={styles.scoreNumber}>
										{team.score}
									</span>
									<span className={styles.scoreLabel}>
										{t("gameFinished.points")}
									</span>
								</div>
								{mvp ? (
									<div className={styles.mvpBox}>
										<div className={styles.mvpBadge}>
											{t("gameFinished.mvp")}
										</div>
										<div className={styles.mvpName}>
											{mvp.name}
										</div>
										<div className={styles.mvpPoints}>
											+{mvp.score}
										</div>
									</div>
								) : (
									<div className={styles.noMvp}>
										{t("gameFinished.noMvp")}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{remainingTeams.length > 0 && (
				<div className={styles.remainingContainer}>
					<h3 className={styles.remainingTitle}>
						{t("gameFinished.otherTeams")}
					</h3>
					<div className={styles.remainingList}>
						{remainingTeams.map((team, index) => {
							const place = index + 4;
							return (
								<div
									key={team.id}
									className={styles.remainingRow}
								>
									<div className={styles.remainingLeft}>
										<span className={styles.remainingPlace}>
											{place}
										</span>
										<span
											className={styles.remainingTeamName}
										>
											{team.name}
										</span>
									</div>
									<div className={styles.remainingRight}>
										<span className={styles.remainingScore}>
											{team.score}{" "}
											{t("gameFinished.points")}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			<div className={styles.actions}>
				<Button onClick={handleLeaveGame} className={styles.backButton}>
					{t("gameFinished.backToList")}
				</Button>
				{game.ownerId === user.id && (
					<Button
						variant="danger"
						onClick={() => {
							socketClient.emit("deleteGame", {
								roomId: game.id,
							});
							handleLeaveGame();
						}}
						className={styles.deleteButton}
					>
						{t("gameFinished.deleteGame")}
					</Button>
				)}
			</div>
		</div>
	);
}
