import {
	Link,
	useNavigate,
	useLocation,
	useSearchParams,
} from "react-router-dom";
import styles from "./header.module.css";
import { useAuth } from "@entities/auth";
import { UserProfilePopup } from "@entities/user-profile";
import { useTranslation } from "react-i18next";
import { Select } from "@shared/ui/select";
import { useQuery, socketClient } from "@shared/api";
import { Button } from "@shared/ui";
import { useQueryClient } from "@tanstack/react-query";

export function Header() {
	const { user } = useAuth();
	const { i18n, t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const queryClient = useQueryClient();

	const { data: activeGameData } = useQuery(
		"get",
		"/games/current",
		{},
		{
			enabled: !!user,
			refetchOnWindowFocus: true,
		},
	);

	const activeRoomId = activeGameData?.roomId;
	const activeCode = activeGameData?.code;

	const isCurrentlyInActiveGame =
		location.pathname === "/game" &&
		searchParams.get("id") === activeRoomId;

	const showReturnButton = !!activeRoomId && !isCurrentlyInActiveGame;

	const handleLeaveGame = () => {
		if (activeRoomId) {
			socketClient.emit("leaveGame", { roomId: activeRoomId });
			navigate("/games");
			queryClient.invalidateQueries({
				queryKey: ["get", "/games/current"],
			});
		}
	};

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
						{showReturnButton && (
							<>
								<Button
									variant="primary"
									size="small"
									onClick={() =>
										navigate(
											`/game?id=${activeRoomId}${activeCode ? `&code=${activeCode}` : ""}`,
										)
									}
								>
									{t("common.returnToGame")}
								</Button>
								<Button
									variant="danger"
									size="small"
									onClick={handleLeaveGame}
								>
									{t("common.leaveGame")}
								</Button>
							</>
						)}
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
