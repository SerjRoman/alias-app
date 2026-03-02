import { useGameSession } from "../model/use-game-session";
import { useSearchParams } from "react-router-dom";
import { LobbyView } from "@pages/game/ui/lobby";
import styles from "./page.module.css";
import { Blocks } from "react-loader-spinner";
import { useKickHandler } from "../model/use-kick-handler";
import { useAuth } from "@entities/auth";
import { useGameSync } from "@entities/game";
import { ActiveGameView } from "@pages/game/ui/active-game";
import { GameFinished } from "@pages/game/ui/game-finished";

export function GamePage() {
	const [searchParams] = useSearchParams();
	const roomId = searchParams.get("id");
	const code = searchParams.get("code");

	const { user } = useAuth();
	const { game, isLoading } = useGameSession(roomId, code);
	useGameSync();
	useKickHandler();

	if (isLoading || !user) {
		return (
			<div className={styles.page}>
				<Blocks
					height="80"
					width="80"
					ariaLabel="blocks-loading"
					visible={true}
				/>
			</div>
		);
	}
	if (!game) {
		return <div>No such game. Go back to game list</div>;
	}
	const view = {
		LOBBY: <LobbyView />,
		IN_PROGRESS: <ActiveGameView />,
		FINISHED: <GameFinished />,
	};
	return (
		<div className={styles.page}>
			<div className={styles.container}>
				<h1 className={styles.title}>{game.settings.name}</h1>
				{view[game.status]}
			</div>
		</div>
	);
}
