import type { GameStateDetails } from "@entities/game";
import { useState } from "react";
import styles from "./admin-panel.module.css";
import { useAdminActions } from "../../api/use-admin-actions";
import { LogOut } from "lucide-react";
import { Button } from "@shared/ui";
import { Select } from "@shared/ui/select";
import { useTranslation } from "react-i18next";
import { ConfirmationModal, type ConfirmationModalProps } from "@shared/ui/modal";
import { useModal } from "@shared/lib/hooks";

export interface AdminPanelProps {
	game: GameStateDetails;
	onClose: () => void;
}

export function AdminPanel({ game, onClose }: Readonly<AdminPanelProps>) {
	const { t } = useTranslation();
	const [selectedGuesserId, setSelectedGuesserId] = useState("");
	const [selectedKickId, setSelectedKickId] = useState("");
	const [selectedTeamId, setSelectedTeamId] = useState("");
	const [selectedPlayerId, setSelectedPlayerId] = useState("");
	const [modalControl, ModalProvider] = useModal<
		Omit<ConfirmationModalProps, "isOpen" | "onClose">
	>();
	const {
		setGuesser,
		kickPlayer,
		banPlayer,
		startRound,
		endGame,
		assignPlayerToTeam,
		shufflePlayers,
		changeRoundTime,
		startPointing,
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
	const isGameInLobby = game.status === "LOBBY";
	return (
		<div className={styles.panel}>
			<div className={styles.header}>
				<h3 className={styles.title}>Панель администратора</h3>
				<Button
					onClick={onClose}
					variant="secondary"
					className={styles.closeButton}
				>
					<LogOut />
				</Button>
			</div>

			{currentRound?.status === "IN_PROGRESS" && (
				<div className={styles.row}>
					<span>Время:</span>
					<div className={styles.controls}>
						<Button
							variant="secondary"
							onClick={() => changeRoundTime(-5)}
						>
							-5 sec
						</Button>
						<Button
							variant="secondary"
							onClick={() => changeRoundTime(-10)}
						>
							-10 sec
						</Button>
						<Button
							variant="secondary"
							onClick={() => changeRoundTime(5)}
						>
							+5 sec
						</Button>
						<Button
							variant="secondary"
							onClick={() => changeRoundTime(10)}
						>
							+10 sec
						</Button>
					</div>
				</div>
			)}
			{isGameInLobby && (
				<div className={styles.row}>
					<span>Переместить игрока в команду:</span>
					<Select
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
					</Select>
					<Select
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
					</Select>
					<Button
						variant="primary"
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
					</Button>
				</div>
			)}
			{isGameInLobby && (
				<div className={styles.row}>
					<Button
						variant="primary"
						onClick={() => {
							shufflePlayers();
						}}
						disabled={
							game.teams.length < 1 || !game.players?.length
						}
					>
						Перетасовать игроков
					</Button>
				</div>
			)}
			{game.currentRound?.status === "PENDING" && (
				<div className={styles.row}>
					<span>Ведущий:</span>
					<Select
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
					</Select>
					<Button
						variant="primary"
						onClick={() => {
							setGuesser(selectedGuesserId);
							setSelectedGuesserId("");
						}}
						disabled={!selectedGuesserId}
					>
						Назначить
					</Button>
				</div>
			)}

			<div className={styles.row}>
				<span>Исключить / Забанить:</span>
				<div className={styles.controls}>
					<Select
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
					</Select>
					<Button
						variant="secondary"
						onClick={() => {
							if (!selectedKickId) return;
							const playerName = game.players?.find((p) => p.id === selectedKickId)?.name || "";
							modalControl.open({
								title: t("admin.kickTitle"),
								message: t("admin.kickConfirm", { name: playerName }),
								confirmText: t("admin.kickButton"),
								variant: "secondary",
								onConfirm: () => {
									kickPlayer(selectedKickId);
									setSelectedKickId("");
								},
							});
						}}
						disabled={!selectedKickId}
					>
						{t("admin.kickButton")}
					</Button>
					<Button
						variant="danger"
						onClick={() => {
							if (!selectedKickId) return;
							const playerName = game.players?.find((p) => p.id === selectedKickId)?.name || "";
							modalControl.open({
								title: t("admin.banTitle"),
								message: t("admin.banConfirm", { name: playerName }),
								confirmText: t("admin.banButton"),
								variant: "danger",
								onConfirm: () => {
									banPlayer(selectedKickId);
									setSelectedKickId("");
								},
							});
						}}
						disabled={!selectedKickId}
					>
						{t("admin.banButton")}
					</Button>
				</div>
			</div>

			<ModalProvider ModalComponent={ConfirmationModal} />

			{currentRound && (
				<div className={styles.actionsBox}>
					<Button
						variant="primary"
						onClick={startRound}
						disabled={currentRound.status !== "PENDING"}
					>
						Запустить раунд
					</Button>
					<Button
						variant="primary"
						onClick={startPointing}
						disabled={currentRound.status !== "IN_PROGRESS"}
					>
						Запустить оценивание
					</Button>
				</div>
			)}
			<Button
				variant="danger"
				style={{ marginTop: "auto" }}
				onClick={endGame}
			>
				Завершить игру
			</Button>
		</div>
	);
}
