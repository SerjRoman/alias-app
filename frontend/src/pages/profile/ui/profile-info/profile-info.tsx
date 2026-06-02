import { useTranslation } from "react-i18next";
import styles from "./profile-info.module.css";

interface ProfileUser {
	avatarUrl?: string | null;
	name?: string | null;
	username: string;
	totalGamesPlayed: number;
	totalWins: number;
	totalScore: number;
}

interface ProfileInfoProps {
	user: ProfileUser;
}

export function ProfileInfo({ user }: Readonly<ProfileInfoProps>) {
	const { t } = useTranslation();

	return (
		<header className={styles.header}>
			<img
				src={user.avatarUrl ?? "/default-avatar.png"}
				alt="Avatar"
				className={styles.avatar}
			/>
			<div className={styles.userInfo}>
				<h1 className={styles.name}>{user.name ?? user.username}</h1>
				<p className={styles.username}>@{user.username}</p>
				<div className={styles.stats}>
					<span>{t("profile.played", { count: user.totalGamesPlayed })}</span>
					<span>{t("profile.wins", { count: user.totalWins })}</span>
					<span>{t("profile.score", { count: user.totalScore })}</span>
				</div>
			</div>
		</header>
	);
}
