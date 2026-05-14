import { socketClient } from "@shared/api";
import { DoorOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./header.module.css";
import { useAuth } from "@entities/auth";
import { useGameSlice } from "@entities/game";
import { UserProfilePopup } from "@entities/user-profile";

export function Header() {
	const { game } = useGameSlice();
	const { user, setUser, setToken } = useAuth();
	const navigate = useNavigate();

	return (
		<header className={styles.header}>
			<Link to="/games" className={styles.logo}>
				Alias Game
			</Link>
			<div className={styles.rightSection}>
				{game !== null && (
					<button
						className={styles.leaveBtn}
						onClick={() =>
							socketClient.emit(
								"leaveGame",
								{
									roomId: game.id,
								},
								() => {
									navigate("/games");
								},
							)
						}
					>
						<DoorOpen size={20} />
						Leave Game
					</button>
				)}
				{user && (
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "16px",
						}}
					>
						<UserProfilePopup />
						<button
							onClick={() => {
								setUser(null);
								setToken(null);
								navigate("/login");
							}}
							className={styles.signOutBtn}
						>
							Sign out
						</button>
					</div>
				)}
			</div>
		</header>
	);
}
