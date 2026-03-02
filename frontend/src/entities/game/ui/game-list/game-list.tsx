import { useState } from "react";
import type { GameState } from "../../model";
import styles from "./game-list.module.css";

type GameListProps = {
	games: GameState[];
	onJoin: (
		game: GameState,
		code: string | null,
	) => Promise<string | null | void>;
};

export function GameList({ games, onJoin }: Readonly<GameListProps>) {
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
				<GameCard onJoin={onJoin} key={game.id} game={game} />
			))}
		</div>
	);
}

function GameCard({
	game,
	onJoin,
}: Readonly<{
	game: GameState;
	onJoin: (
		game: GameState,
		code: string | null,
	) => Promise<string | null | void>;
}>) {
	const [code, setCode] = useState<string>("");
	const isLobby = game.status === "LOBBY";
	const statusClass = isLobby ? styles.statusLobby : styles.statusInProgress;
	const [error, setError] = useState<string | null>(null);
	async function handleJoin() {
		setError(null);
		const result = await onJoin(game, code);
		if (result) {
			setError(result);
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
				onClick={handleJoin}
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
