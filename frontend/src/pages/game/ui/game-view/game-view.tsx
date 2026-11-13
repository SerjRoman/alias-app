import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useGameSlice } from "@entities/game";
import { useAuth } from "@shared/api";
import { useActiveGameSync } from "../../api";
import { GameHeader, type GameVisualTheme } from "./header/game-header";
import { LeftSidebar } from "./left-sidebar/left-sidebar";
import { CenterArena } from "./center-arena/center-arena";
import { RightSidebar } from "./right-sidebar/right-sidebar";
import styles from "./game-view.module.css";

const THEME_STORAGE_KEY = "alias_game_visual_theme";
const TEAM_FALLBACK_COLORS = ["#f43f5e", "#0ea5e9", "#10b981", "#f59e0b"];

export function GameView() {
	const hasActiveGame = useGameSlice((state) =>
		Boolean(state.game && state.game.currentRound),
	);
	const teams = useGameSlice((state) => state.game?.teams ?? []);
	const activeTeamId = useGameSlice(
		(state) => state.game?.currentRound?.teamId,
	);
	const { user } = useAuth();
	const navigate = useNavigate();
	useActiveGameSync();

	const [theme, setTheme] = useState<GameVisualTheme>(() => {
		try {
			const saved = localStorage.getItem(THEME_STORAGE_KEY);
			return saved === "party" ? "party" : "tabletop";
		} catch {
			return "tabletop";
		}
	});

	const handleThemeChange = (nextTheme: GameVisualTheme) => {
		setTheme(nextTheme);
		try {
			localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
		} catch {
			// Ignore storage errors
		}
	};

	const activeTeamColor = useMemo(() => {
		if (!activeTeamId) return "#6366f1";
		const index = teams.findIndex((t) => t.id === activeTeamId);
		if (index === -1) return "#6366f1";
		return TEAM_FALLBACK_COLORS[index % TEAM_FALLBACK_COLORS.length];
	}, [teams, activeTeamId]);

	useEffect(() => {
		document.documentElement.classList.add("game-scroll-lock");
		document.body.classList.add("game-scroll-lock");
		return () => {
			document.documentElement.classList.remove("game-scroll-lock");
			document.body.classList.remove("game-scroll-lock");
		};
	}, []);

	useEffect(() => {
		if (!hasActiveGame || !user) {
			void navigate("/games");
		}
	}, [hasActiveGame, user, navigate]);

	if (!hasActiveGame || !user) {
		return null;
	}

	return (
		<div
			className={styles.gamePageLayout}
			data-game-theme={theme}
			style={
				{
					"--active-team-color": activeTeamColor,
				} as CSSProperties
			}
		>
			<GameHeader theme={theme} onThemeChange={handleThemeChange} />

			<div className={styles.mainStage}>
				<LeftSidebar />

				<CenterArena />

				<RightSidebar />
			</div>
		</div>
	);
}
