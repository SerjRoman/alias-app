import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameSlice } from "@entities/game";
import { GameHeader } from "./header/game-header";
import { LeftSidebar } from "./left-sidebar/left-sidebar";
import { CenterArena } from "./center-arena/center-arena";
import { RightSidebar } from "./right-sidebar/right-sidebar";
import styles from "./game-view.module.css";
import { useActiveGameSync } from "../../api";
import { useAuth } from "@shared/api";

export function GameView() {
	const hasActiveGame = useGameSlice((state) =>
		Boolean(state.game && state.game.currentRound),
	);
	const { user } = useAuth();
	const navigate = useNavigate();
	useActiveGameSync();

	useEffect(() => {
		if (!hasActiveGame || !user) {
			void navigate("/games");
		}
	}, [hasActiveGame, user, navigate]);

	if (!hasActiveGame || !user) {
		return null;
	}

	return (
		<div className={styles.gamePageLayout}>
			<GameHeader />

			<div className={styles.mainStage}>
				<LeftSidebar />

				<CenterArena />

				<RightSidebar />
			</div>
		</div>
	);
}
