import { Loader2 } from "lucide-react";
import { useGameSession } from "../model/use-game-session";
import { useSearchParams } from "react-router-dom";
import { LobbyView } from "@widgets/lobby";
import { ActiveGameView } from "@widgets/active-game";
import styles from "./page.module.css";
import { useAuth } from "@entities/auth/model";
import { useGameSync } from "@entities/game/model";
import { socketClient } from "@shared/api/socket";

export function GamePage() {
	const [searchParams] = useSearchParams();
	const roomId = searchParams.get("id");
	const code = searchParams.get("code");

	const { user } = useAuth();
	const { game, isLoading } = useGameSession(roomId, code);

	useGameSync();

	if (isLoading || !user) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					marginTop: 50,
				}}
			>
				<Loader2 className="animate-spin" size={48} />
			</div>
		);
	}
	if (!game) {
		return <div>No such game. Go back to game list</div>;
	}
	return (
		<div className={styles.page}>
			<div className={styles.container}>
				<h1 className={styles.title}>{game.settings.name}</h1>
				<button
					onClick={() => socketClient.emit("leaveGame", { roomId })}
				>
					Leave game
				</button>
				{game.status === "LOBBY" ? <LobbyView /> : <ActiveGameView />}
			</div>
		</div>
	);
}
