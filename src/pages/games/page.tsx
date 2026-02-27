import { useNavigate } from "react-router-dom";
import { type GameState } from "../../entities/game/model";
import { useQuery } from "../../shared/api";
import { GameList } from "../../entities/game/ui";
import { useState } from "react";
import { CreateGameForm } from "./create-game/create-game";
import styles from "./page.module.css";
import { RefreshCcw } from "lucide-react";

export function GamesPage() {
	const {
		data: games,
		isLoading,
		refetch,
		isFetching,
	} = useQuery("get", "/games", {
		headers: { "ngrok-skip-browser-warning": "true" },
	});
	const [code, setCode] = useState<string>("");
	const navigate = useNavigate();

	function handleJoin(game: GameState) {
		const c: string | null = code.length === 0 ? "" : `&code=${code}`;
		navigate(`/game?id=${game.id}${c}`);
	}
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
					games && (
						<GameList
							games={sortedGames}
							onJoin={handleJoin}
							code={code}
							setCode={setCode}
						/>
					)
				)}
			</div>
			<CreateGameForm />
		</div>
	);
}
