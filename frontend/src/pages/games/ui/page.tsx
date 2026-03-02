import { CreateGameForm } from "./create-game/create-game";
import styles from "./page.module.css";
import { RefreshCcw } from "lucide-react";
import { useMutation, useQuery } from "@shared/api";
import { GameList, type GameState } from "@entities/game";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@entities/auth";

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
	const { token } = useAuth();
	const navigate = useNavigate();
	const { mutate: validateCode } = useMutation(
		"post",
		"/games/validate-code",
	);
	async function handleJoin(game: GameState, code: string | null) {
		if (game.settings.isPrivate) {
			if (!code || code.length === 0) {
				return "Access code is required";
			}
			validateCode(
				{
					body: {
						code,
						roomId: game.id,
					},
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
				{
					onSuccess: ({ valid }) => {
						if (!valid) {
							return "Invalid access code";
						}
						const c: string =
							!code || code.length === 0 ? "" : `&code=${code}`;
						navigate(`/game?id=${game.id}${c}`);
					},
					onError() {
						return "Failed to validate code. Please try again.";
					},
				},
			);
		} else {
			navigate(`/game?id=${game.id}`);
		}
	}
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
							games={sortedGames as GameState[]}
							onJoin={handleJoin}
						/>
					)
				)}
			</div>
			<CreateGameForm />
		</div>
	);
}
