import { socketClient } from "@shared/api/socket";
import { DoorOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useGameSlice } from "@entities/game/model";
import { useAuth } from "@entities/auth/model";
import styles from "./header.module.css";

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
					<div>
						<span>Welcome, {user.name}!</span>
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
