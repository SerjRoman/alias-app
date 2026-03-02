import { CreateGameForm } from "./create-game/create-game";
import styles from "./page.module.css";
import { RefreshCcw } from "lucide-react";
import type { GameState } from "@entities/game/model";
import { GameList } from "@entities/game/ui";
import { useQuery } from "@shared/api";

export function GamesPage() {
	const {
		data: games,
		isLoading,
		refetch,
		isFetching,
	} = useQuery("get", "/games", {
		headers: { "ngrok-skip-browser-warning": "true" },
	});

	const sortedGames = games
		? [...games].sort((a, b) => b.createdAt - a.createdAt)
		: [];

	return (
		<div className={styles.pageContainer}>
			<div className={styles.sectionList}>
				<h2 className={styles.sectionTitle}>Available Games</h2>
				<button
					className={styles.refreshButton}
					onClick={() => refetch()}
					disabled={isFetching}
					title="Update list"
				>
					{isFetching ? "Updating..." : "Refresh"}
					<RefreshCcw
						size={18}
						className={isFetching ? styles.spinning : undefined}
					/>
				</button>

				{isLoading ? (
					<div>Loading games...</div>
				) : (
					games && <GameList games={sortedGames as GameState[]} />
				)}
			</div>
			<CreateGameForm />
		</div>
	);
}
