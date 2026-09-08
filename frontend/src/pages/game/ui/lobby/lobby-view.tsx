import { Plus, Play, Eye } from "lucide-react";
import { useState } from "react";
import styles from "./lobby-view.module.css";
import { SettingsPanel } from "./settings-panel/settings-panel";
import { LobbyTeamView } from "./lobby-team-view/lobby-team-view";
import { SpectatorsList } from "../spectators-list";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@shared/api";
import { useGameSlice, type PlayerDisplayInfo } from "@entities/game";
import { useLobbyActions } from "../../api";
import { ToggleGameReadyButton } from "./game-ready-button/game-ready-button";
import { CustomWordsForm } from "./custom-words-form/custom-words-form";
import { Button, Tooltip } from "@shared/ui";
import { useTranslation } from "react-i18next";
import { CreateTeamModal } from "./create-team-modal";

interface LobbyViewProps {
	playersDisplayMap: Map<string, PlayerDisplayInfo>;
}

export function LobbyView({ playersDisplayMap }: Readonly<LobbyViewProps>) {
	const { t } = useTranslation();
	const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
	const { game } = useGameSlice();
	const { user } = useAuth();
	const { createTeam, startGame } = useLobbyActions();
	const navigate = useNavigate();
	if (!game || !user) {
		navigate("/games");
		return null;
	}

	const isOwner = game.ownerId === user.id;
	const mePlayer = game.players.find((p) => user.id === p.id);
	const allAssignedIds = new Set(game.teams.flatMap((t) => t.playerIds));
	const unassignedPlayers = game.players.filter(
		(p) => !allAssignedIds.has(p.id),
	);
	const assignedPlayers = game.players.filter((p) => allAssignedIds.has(p.id));
	const isAllReady =
		assignedPlayers.length > 0 && assignedPlayers.every((p) => p.isReady);

	return (
		<div className={styles.container}>
			<SettingsPanel game={game} isOwner={isOwner} />
			<SpectatorsList
				players={unassignedPlayers}
				playersDisplayMap={playersDisplayMap}
			/>

			<div className={styles.teamContainer}>
				<div className={styles.teamListHeader}>
					<h2>{t("lobby.teams")}</h2>
				</div>

				<div className={styles.teamsGrid}>
					{game.teams.map((team) => (
						<LobbyTeamView
							key={team.id}
							team={team}
							playersDisplayMap={playersDisplayMap}
						/>
					))}
					{isOwner && (
						<button
							type="button"
							className={styles.addTeamCard}
							onClick={() => setIsCreateTeamModalOpen(true)}
							aria-label={t("lobby.addTeamCard")}
						>
							<div className={styles.addTeamCardIcon}>
								<Plus size={18} />
							</div>
							<span className={styles.addTeamCardText}>
								{t("lobby.addTeamCard")}
							</span>
						</button>
					)}
				</div>

				{game.teams.length === 0 && !isOwner && (
					<p className={styles.emptyMessage}>{t("lobby.noTeams")}</p>
				)}
			</div>
			{game.settings.isHatMode && allAssignedIds.has(user.id) && (
				<div
					style={{
						maxWidth: "450px",
						width: "100%",
						margin: "0 auto var(--spacing-medium) auto",
					}}
				>
					<CustomWordsForm
						roomId={game.id}
						wordsCount={game.settings.wordsPerPlayer || 0}
						submittedWordsCount={mePlayer?.submittedWordsCount || 0}
					/>
				</div>
			)}
			{allAssignedIds.has(user.id) ? (
				<div className={styles.toggleReadyContainer}>
					<ToggleGameReadyButton
						roomId={game.id}
						isReady={mePlayer?.isReady || false}
					/>
				</div>
			) : (
				<div className={styles.spectatorNotice}>
					<Eye size={18} />
					<span>{t("lobby.youAreSpectator")}</span>
				</div>
			)}
			{isOwner && (
				<div className={styles.startGameContainer}>
					<Tooltip text={t("tooltips.startGame")} position="top">
						<Button
							onClick={() => startGame(game.id)}
							className={styles.startGameButton}
							disabled={game.teams.length < 2 || !isAllReady}
						>
							<Play fill="currentColor" size={20} />{" "}
							{t("lobby.startGame")}
						</Button>
					</Tooltip>
				</div>
			)}
			{isOwner && (
				<CreateTeamModal
					isOpen={isCreateTeamModalOpen}
					onClose={() => setIsCreateTeamModalOpen(false)}
					onCreate={(teamName) => createTeam(game.id, teamName)}
				/>
			)}
		</div>
	);
}
