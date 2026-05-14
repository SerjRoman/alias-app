import type { GameStateDetails } from "@entities/game";
import { useState } from "react";
import styles from "./admin-panel.module.css";
import { useAdminActions } from "../../model/use-admin-actions";
import { LogOut } from "lucide-react";

export interface AdminPanelProps {
	game: GameStateDetails;
	onClose: () => void;
}

export function AdminPanel({ game, onClose }: Readonly<AdminPanelProps>) {
	const [selectedGuesserId, setSelectedGuesserId] = useState("");
	const [selectedKickId, setSelectedKickId] = useState("");
	const [selectedTeamId, setSelectedTeamId] = useState("");
	const [selectedPlayerId, setSelectedPlayerId] = useState("");
	const {
		addTime,
		setGuesser,
		kickPlayer,
		startRound,
		endRound,
		endGame,
		assignPlayerToTeam,
	} = useAdminActions(game.id);
	const playingTeam = game.teams.find(
		(t) =>
			t.id === game.currentRound?.teamId &&
			game.currentRound.status === "PENDING",
	);
	const teamPlayers =
		game.players?.filter((p) => playingTeam?.playerIds.includes(p.id)) ||
		[];
	const currentRound = game.currentRound;
	return (
		<div className={styles.panel}>
			<div className={styles.header}>
				<h3 className={styles.title}>Панель администратора</h3>
				<button onClick={onClose} className={styles.closeButton}>
					<LogOut />
				</button>
			</div>

			{currentRound?.status === "IN_PROGRESS" && (
				<div className={styles.row}>
					<span>Время:</span>
					<div className={styles.controls}>
						<button
							className={styles.button}
							onClick={() => addTime(-5)}
						>
							-5 sec
						</button>
						<button
							className={styles.button}
							onClick={() => addTime(-10)}
						>
							-10 sec
						</button>
						<button
							className={styles.button}
							onClick={() => addTime(5)}
						>
							+5 sec
						</button>
						<button
							className={styles.button}
							onClick={() => addTime(10)}
						>
							+10 sec
						</button>
					</div>
				</div>
			)}
			{game.status === "LOBBY" && (
				<div className={styles.row}>
					<span>Перемстить игрока в команду:</span>
					<select
						className={styles.select}
						value={selectedPlayerId}
						onChange={(e) => setSelectedPlayerId(e.target.value)}
					>
						<option value="" disabled>
							Выберите игрока
						</option>
						{game.players?.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
					<select
						className={styles.select}
						value={selectedTeamId}
						onChange={(e) => setSelectedTeamId(e.target.value)}
					>
						<option value="" disabled>
							Выберите команду
						</option>
						{game.teams?.map((t) => (
							<option key={t.id} value={t.id}>
								{t.name}
							</option>
						))}
					</select>
					<button
						className={styles.button}
						onClick={() => {
							if (!selectedPlayerId || !selectedTeamId) return;
							assignPlayerToTeam(
								selectedTeamId,
								selectedPlayerId,
							);
							setSelectedPlayerId("");
							setSelectedTeamId("");
						}}
						disabled={!selectedPlayerId}
					>
						Назначить
					</button>
				</div>
			)}
			{game.currentRound?.status === "PENDING" && (
				<div className={styles.row}>
					<span>Ведущий:</span>
					<select
						className={styles.select}
						value={selectedGuesserId}
						onChange={(e) => setSelectedGuesserId(e.target.value)}
					>
						<option value="" disabled>
							Выберите игрока
						</option>
						{teamPlayers.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name}
							</option>
						))}
					</select>
					<button
						className={styles.button}
						onClick={() => {
							setGuesser(selectedGuesserId);
							setSelectedGuesserId("");
						}}
						disabled={!selectedGuesserId}
					>
						Назначить
					</button>
				</div>
			)}

			<div className={styles.row}>
				<span>Кикнуть:</span>
				<select
					className={styles.select}
					value={selectedKickId}
					onChange={(e) => setSelectedKickId(e.target.value)}
				>
					<option value="" disabled>
						Выберите игрока
					</option>
					{game.players?.map((p) => (
						<option key={p.id} value={p.id}>
							{p.name}
						</option>
					))}
				</select>
				<button
					className={`${styles.button} ${styles.danger}`}
					onClick={() => {
						kickPlayer(selectedKickId);
						setSelectedKickId("");
					}}
					disabled={!selectedKickId}
				>
					Выгнать
				</button>
			</div>

			{currentRound && (
				<div className={styles.actionsBox}>
					<button
						className={`${styles.button} ${styles.success}`}
						onClick={startRound}
						disabled={currentRound.status !== "PENDING"}
					>
						Запустить раунд
					</button>
					<button
						className={`${styles.button} ${styles.warning}`}
						onClick={endRound}
						disabled={currentRound.status !== "IN_PROGRESS"}
					>
						Завершить раунд
					</button>
				</div>
			)}
			<button
				className={`${styles.button} ${styles.danger}`}
				style={{ marginTop: "auto" }}
				onClick={endGame}
			>
				Завершить игру
			</button>
		</div>
	);
}
