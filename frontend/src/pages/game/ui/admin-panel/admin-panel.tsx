import type { GameStateDetails } from "@entities/game";
import { useState } from "react";
import styles from "./admin-panel.module.css";
import { useAdminActions } from "../../api/use-admin-actions";
import { LogOut } from "lucide-react";
import { Button } from "@shared/ui";
import { Select } from "@shared/ui/select";
import { useTranslation } from "react-i18next";
import {
	ConfirmationModal,
	type ConfirmationModalProps,
} from "@shared/ui/modal";
import { useModal } from "@shared/lib/hooks";
import { CreateTeamModal } from "../lobby/create-team-modal";

export interface AdminPanelProps {
	game: GameStateDetails;
	onClose: () => void;
}

export function AdminPanel({ game, onClose }: Readonly<AdminPanelProps>) {
	const { t } = useTranslation();
	const [selectedExplainerId, setSelectedExplainerId] = useState("");
	const [selectedKickId, setSelectedKickId] = useState("");
	const [selectedTeamId, setSelectedTeamId] = useState("");
	const [selectedPlayerId, setSelectedPlayerId] = useState("");
	const [selectedDeleteTeamId, setSelectedDeleteTeamId] = useState("");
	const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
	const [modalControl, ModalProvider] =
		useModal<Omit<ConfirmationModalProps, "isOpen" | "onClose">>();
	const {
		setExplainer,
		createTeam,
		deleteTeam,
		kickPlayer,
		banPlayer,
		startRound,
		endGame,
		assignPlayerToTeam,
		shufflePlayers,
		changeRoundTime,
		startPointing,
		moveToSpectators,
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
				<h3 className={styles.title}>{t("admin.title")}</h3>
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
					<span>{t("admin.time")}</span>
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

			<div className={styles.row}>
				<span>{t("admin.teamManagement", "Управление командами:")}</span>
				<div className={styles.controls}>
					<Button
						variant="primary"
						onClick={() => setIsCreateTeamOpen(true)}
					>
						+ {t("admin.createTeamTitle", "Создать команду")}
					</Button>
				</div>
			</div>

			<div className={styles.row}>
				<span>{t("admin.deleteTeamTitle", "Удалить команду:")}</span>
				<div className={styles.controls}>
					<Select
						className={styles.select}
						value={selectedDeleteTeamId}
						onChange={(e) => setSelectedDeleteTeamId(e.target.value)}
					>
						<option value="" disabled>
							{t("admin.selectTeamToDelete", "Выберите команду")}
						</option>
						{game.teams?.map((team) => {
							const isPlaying = Boolean(
								!isGameInLobby &&
									game.currentRound &&
									(game.currentRound.teamId === team.id ||
										(game.activeTeamId &&
											game.activeTeamId === team.id)),
							);
							return (
								<option
									key={team.id}
									value={team.id}
									disabled={isPlaying}
								>
									{team.name} ({team.playerIds.length} игр.)
									{isPlaying ? ` (${t("admin.playingBadge", "играет")})` : ""}
								</option>
							);
						})}
					</Select>
					<Button
						variant="danger"
						onClick={() => {
							if (!selectedDeleteTeamId) return;
							const teamToDelete = game.teams.find(
								(team) => team.id === selectedDeleteTeamId,
							);
							modalControl.open({
								title: t("admin.deleteTeamTitle", "Удалить команду"),
								message: t(
									"admin.deleteTeamConfirm",
									`Удалить команду "${teamToDelete?.name}"? Игроки перейдут в зрители.`,
									{ name: teamToDelete?.name },
								),
								confirmText: t("common.delete", "Удалить"),
								variant: "danger",
								onConfirm: () => {
									deleteTeam(selectedDeleteTeamId);
									setSelectedDeleteTeamId("");
								},
							});
						}}
						disabled={
							!selectedDeleteTeamId ||
							(!isGameInLobby &&
								(game.teams.length <= 2 ||
									game.currentRound?.teamId === selectedDeleteTeamId ||
									(Boolean(game.activeTeamId) &&
										game.activeTeamId === selectedDeleteTeamId)))
						}
					>
						{t("common.delete", "Удалить")}
					</Button>
				</div>
				{!isGameInLobby && game.teams.length <= 2 && (
					<span className={styles.warningHint}>
						{t("admin.minTeamsWarning", "В игре должно оставаться минимум 2 команды")}
					</span>
				)}
			</div>

			<div className={styles.row}>
				<span>{t("admin.movePlayerToTeam")}</span>
				<Select
					className={styles.select}
					value={selectedPlayerId}
					onChange={(e) => setSelectedPlayerId(e.target.value)}
				>
					<option value="" disabled>
						{t("admin.selectPlayer")}
					</option>
					{game.players?.map((p) => {
						const isSpec =
							game.spectators?.includes(p.id) ||
							!game.teams.some((team) =>
								team.playerIds.includes(p.id),
							);
						const currentTeam = game.teams.find((team) =>
							team.playerIds.includes(p.id),
						);
						const tag = isSpec
							? `[${t("admin.spectatorLabel", "Зритель")}]`
							: `[${currentTeam?.name || "Команда"}]`;
						return (
							<option key={p.id} value={p.id}>
								{p.name} {tag}
							</option>
						);
					})}
				</Select>
				<Select
					className={styles.select}
					value={selectedTeamId}
					onChange={(e) => setSelectedTeamId(e.target.value)}
				>
					<option value="" disabled>
						{t("admin.selectTeam")}
					</option>
					<option value="__SPECTATORS__">
						{t("admin.spectatorsOption")}
					</option>
					{game.teams?.map((team) => (
						<option key={team.id} value={team.id}>
							{team.name}
						</option>
					))}
				</Select>
				<Button
					variant="primary"
					onClick={() => {
						if (!selectedPlayerId || !selectedTeamId) return;
						if (selectedTeamId === "__SPECTATORS__") {
							moveToSpectators(selectedPlayerId);
						} else {
							assignPlayerToTeam(
								selectedTeamId,
								selectedPlayerId,
							);
						}
						setSelectedPlayerId("");
						setSelectedTeamId("");
					}}
					disabled={!selectedPlayerId || !selectedTeamId}
				>
					{t("admin.assign")}
				</Button>
			</div>

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
						{t("admin.shuffle")}
					</Button>
				</div>
			)}
			{game.currentRound?.status === "PENDING" && (
				<div className={styles.row}>
					<span>{t("admin.explainer", "Объясняющий:")}</span>
					<Select
						className={styles.select}
						value={selectedExplainerId}
						onChange={(e) => setSelectedExplainerId(e.target.value)}
					>
						<option value="" disabled>
							{t("admin.selectPlayer")}
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
							setExplainer(selectedExplainerId);
							setSelectedExplainerId("");
						}}
						disabled={!selectedExplainerId}
					>
						{t("admin.assign")}
					</Button>
				</div>
			)}

			<CreateTeamModal
				isOpen={isCreateTeamOpen}
				onClose={() => setIsCreateTeamOpen(false)}
				onCreate={(teamName) => {
					createTeam(teamName);
					setIsCreateTeamOpen(false);
				}}
			/>

			<div className={styles.row}>
				<span>{t("admin.kickOrBan")}</span>
				<div className={styles.controls}>
					<Select
						className={styles.select}
						value={selectedKickId}
						onChange={(e) => setSelectedKickId(e.target.value)}
					>
						<option value="" disabled>
							{t("admin.selectPlayer")}
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
							const playerName =
								game.players?.find(
									(p) => p.id === selectedKickId,
								)?.name || "";
							modalControl.open({
								title: t("admin.kickTitle"),
								message: t("admin.kickConfirm", {
									name: playerName,
								}),
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
							const playerName =
								game.players?.find(
									(p) => p.id === selectedKickId,
								)?.name || "";
							modalControl.open({
								title: t("admin.banTitle"),
								message: t("admin.banConfirm", {
									name: playerName,
								}),
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
						{t("admin.startRound")}
					</Button>
					<Button
						variant="primary"
						onClick={startPointing}
						disabled={currentRound.status !== "IN_PROGRESS"}
					>
						{t("admin.startPointing")}
					</Button>
				</div>
			)}
			<Button
				variant="danger"
				style={{ marginTop: "auto" }}
				onClick={endGame}
			>
				{t("admin.endGame")}
			</Button>
		</div>
	);
}
