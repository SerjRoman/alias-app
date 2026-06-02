import { useQuery } from "@shared/api";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { GameWordsLevel } from "@entities/game";
import { useAuth } from "@entities/auth";
import { ProfileInfo } from "./profile-info/profile-info";
import { GamesList } from "./games-list/games-list";
import styles from "./page.module.css";

export const ProfilePage = () => {
	const { t } = useTranslation();
	const { userId } = useParams<{ userId: string }>();
	const { token } = useAuth();

	const { data: user, isError } = useQuery(
		"get",
		"/user/{id}/profile",
		{
			params: { path: { id: userId ?? "" } },
		},
		{ enabled: !!userId },
	);

	const { data: gamesData, isLoading: isGamesLoading } = useQuery(
		"get",
		"/history/games/{userId}",
		{
			params: {
				query: { limit: 10, offset: 0 },
				path: { userId: userId ?? "" },
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
		return <div className={styles.centeredMessage}>{t("common.loading")}</div>;
	}

	if (isError) {
		return <div className={styles.centeredMessage}>{t("profile.notFound")}</div>;
	}

	if (!user) {
		return <div className={styles.centeredMessage}>{t("profile.loading")}</div>;
	}

	return (
		<div className={styles.container}>
			<ProfileInfo user={user} />

			<main className={styles.content}>
				<h2>{t("profile.gamesHistory")}</h2>
				{isGamesLoading ? (
					<p>{t("profile.loadingGames")}</p>
				) : gamesData?.items && gamesData.items.length > 0 ? (
					<GamesList games={gamesData.items} />
				) : (
					<p>{t("profile.noGames")}</p>
				)}
			</main>
		</div>
	);
};
