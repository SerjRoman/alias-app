import { useState } from "react";
import type { GameState } from "../../model";
import styles from "./game-list.module.css";
import { useTranslation } from "react-i18next";

type GameListProps = {
	games: GameState[];
	onJoin: (
		game: GameState,
		code: string | null,
	) => Promise<string | null | void>;
	showAssistant?: (msg: any) => void;
};

export function GameList({ games, onJoin, showAssistant }: Readonly<GameListProps>) {
	const { t } = useTranslation();
	if (games.length === 0) {
		return (
			<div style={{ textAlign: "center", color: "#888" }}>
				{t("games.noGames")}
			</div>
		);
	}

	return (
		<div className={styles.grid}>
			{games.map((game) => (
				<GameCard onJoin={onJoin} key={game.id} game={game} showAssistant={showAssistant} />
			))}
		</div>
	);
}

function GameCard({
	game,
	onJoin,
	showAssistant,
}: Readonly<{
	game: GameState;
	onJoin: (
		game: GameState,
		code: string | null,
	) => Promise<string | null | void>;
	showAssistant?: (msg: any) => void;
}>) {
	const { t } = useTranslation();
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
	const status = {
		LOBBY: t("games.lobby"),
		IN_PROGRESS: t("games.inProgress"),
		FINISHED: t("games.finished"),
	};
	return (
		<div key={game.id} className={styles.card}>
			<div className={styles.cardContent}>
				<div className={styles.header}>
					<h4 className={styles.gameName}>{game.settings.name}</h4>
					<span className={`${styles.statusBadge} ${statusClass}`}>
						{status[game.status]}
					</span>
				</div>

				{game.settings.isPrivate && isLobby && (
					<div className={styles.privateSection}>
						<input
							type="text"
							placeholder={t("games.enterCode")}
							className={styles.codeInput}
							value={code}
							onChange={(e) => setCode(e.target.value)}
							onFocus={() => {
								setError(null);
								showAssistant?.(t("games.assistant.codeInputFocus"));
							}}
							onBlur={() => showAssistant?.(null)}
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
				{isLobby ? t("games.join") : t("games.started")}
			</button>
			{error && <div className={styles.errorText}>{error}</div>}
		</div>
	);
}
