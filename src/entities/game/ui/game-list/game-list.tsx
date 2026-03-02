import { useState } from "react";
import type { GameState } from "../../model";
import styles from "./game-list.module.css";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@shared/api";
import { useAuth } from "@entities/auth/model";

type GameListProps = {
	games: GameState[];
};

export function GameList({ games }: Readonly<GameListProps>) {
	if (games.length === 0) {
		return (
			<div style={{ textAlign: "center", color: "#888" }}>
				No active games found. Create one!
			</div>
		);
	}

	return (
		<div className={styles.grid}>
			{games.map((game) => (
				<GameCard key={game.id} game={game} />
			))}
		</div>
	);
}

function GameCard({
	game,
}: Readonly<{
	game: GameState;
}>) {
	const { token } = useAuth();
	const { mutate: validateCode } = useMutation(
		"post",
		"/games/validate-code",
	);
	const [code, setCode] = useState<string>("");
	const isLobby = game.status === "LOBBY";
	const statusClass = isLobby ? styles.statusLobby : styles.statusInProgress;
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	async function handleJoin(game: GameState, code: string | null) {
		if (game.settings.isPrivate) {
			if (!code || code.length === 0) {
				setError("Access code is required");
				return;
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
							setError("Invalid access code");
							return;
						}
						const c: string =
							!code || code.length === 0 ? "" : `&code=${code}`;
						navigate(`/game?id=${game.id}${c}`);
					},
					onError() {
						setError("Failed to validate code. Please try again.");
					},
				},
			);
		}
	}
	return (
		<div key={game.id} className={styles.card}>
			<div className={styles.cardContent}>
				<div className={styles.header}>
					<h4 className={styles.gameName}>{game.settings.name}</h4>
					<span className={`${styles.statusBadge} ${statusClass}`}>
						{game.status}
					</span>
				</div>

				{game.settings.isPrivate && isLobby && (
					<div className={styles.privateSection}>
						<input
							type="text"
							placeholder="Enter access code"
							className={styles.codeInput}
							value={code}
							onChange={(e) => setCode(e.target.value)}
							onFocus={() => setError(null)}
						/>
					</div>
				)}
			</div>

			<button
				className={styles.joinButton}
				onClick={() => handleJoin(game, code)}
				disabled={
					!isLobby || (game.settings.isPrivate && code.length === 0)
				}
			>
				{isLobby ? "Join Game" : "Started"}
			</button>
			{error && <div className={styles.errorText}>{error}</div>}
		</div>
	);
}
