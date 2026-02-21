import type { GameState } from "../model";
import styles from "./game-list.module.css";

type GameListProps = {
	games: GameState[];
	onJoin: (game: GameState) => void;
	code: string;
	setCode: (c: string) => void;
};

export function GameList({
	games,
	onJoin,
	code,
	setCode,
}: Readonly<GameListProps>) {
	if (games.length === 0) {
		return (
			<div style={{ textAlign: "center", color: "#888" }}>
				No active games found. Create one!
			</div>
		);
	}

	return (
		<div className={styles.grid}>
			{games.map((game) => {
				const isLobby = game.status === "LOBBY";
				const statusClass = isLobby
					? styles.statusLobby
					: styles.statusInProgress;

				return (
					<div key={game.id} className={styles.card}>
						<div>
							<div className={styles.header}>
								<h4 className={styles.gameName}>
									{game.settings.name}
								</h4>
								<span
									className={`${styles.statusBadge} ${statusClass}`}
								>
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
										onChange={(e) =>
											setCode(e.target.value)
										}
										onClick={(e) => e.stopPropagation()}
									/>
								</div>
							)}
						</div>

						<button
							className={styles.joinButton}
							onClick={() => onJoin(game)}
							disabled={!isLobby}
						>
							{isLobby ? "Join Game" : "Started"}
						</button>
					</div>
				);
			})}
		</div>
	);
}
