import { Link } from "react-router-dom";
import styles from "./header.module.css";
import { useAuth } from "@entities/auth";
import { UserProfilePopup } from "@entities/user-profile";
import { useTranslation } from "react-i18next";
import { Select } from "@shared/ui/select";

export function Header() {
	const { user } = useAuth();
	const { i18n } = useTranslation();

	return (
		<header className={styles.header}>
			<Link to="/games" className={styles.logo}>
				Alias Game
			</Link>
			<div className={styles.rightSection}>
				{user && (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "16px",
						}}
					>
						<UserProfilePopup />
					</div>
				)}
				<Select
					value={i18n.language}
					onChange={(e) => i18n.changeLanguage(e.target.value)}
				>
					<option value="en">English</option>
					<option value="ru">Русский</option>
					<option value="ua">Українська</option>
				</Select>
			</div>
		</header>
	);
}
