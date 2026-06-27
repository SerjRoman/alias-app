import { Plus, Play } from "lucide-react";
import { useState } from "react";
import styles from "./lobby-view.module.css";
import { SettingsPanel } from "./settings-panel/settings-panel";
import { LobbyTeamView } from "./lobby-team-view/lobby-team-view";
import { UnassignedPlayersList } from "./unassigned-players-list/unassigned-players-list";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@entities/auth";
import { useGameSlice, type PlayerDisplayInfo } from "@entities/game";
import { useLobbyActions } from "../../api";
import { ToggleGameReadyButton } from "./game-ready-button/game-ready-button";
import { CustomWordsForm } from "./custom-words-form/custom-words-form";
import { Button, Tooltip, RandomDice } from "@shared/ui";
import { useTranslation } from "react-i18next";
import { generateTeamName } from "../../lib";

interface LobbyViewProps {
	playersDisplayMap: Map<string, PlayerDisplayInfo>;
}

export function LobbyView({ playersDisplayMap }: Readonly<LobbyViewProps>) {
	const { t } = useTranslation();
	const [newTeamName, setNewTeamName] = useState("");
	const { game } = useGameSlice();
	const { user } = useAuth();
	const { createTeam, startGame } = useLobbyActions();
	const navigate = useNavigate();
	if (!game || !user) {
		navigate("/games");
		return null;
	}
	function handleCreateTeam() {
		if (!newTeamName.trim() || !game) return;
		createTeam(game.id, newTeamName);
		setNewTeamName("");
	}
	const handleRandomName = () => {
		setNewTeamName(generateTeamName(t));
	};

	const isOwner = game.ownerId === user.id;
	const mePlayer = game.players.find((p) => user.id === p.id);
	const allAssignedIds = new Set(game.teams.flatMap((t) => t.playerIds));
	const unassignedPlayers = game.players.filter(
		(p) => !allAssignedIds.has(p.id),
	);
	const isAllReady = game.players.every((p) => p.isReady);

	return (
		<div className={styles.container}>
			<SettingsPanel game={game} isOwner={isOwner} />
			<UnassignedPlayersList
				players={unassignedPlayers}
				roomId={game.id}
				playersDisplayMap={playersDisplayMap}
			/>

			<div className={styles.teamContainer}>
				<div className={styles.teamListHeader}>
					<h2>{t("lobby.teams")}</h2>
					{isOwner && (
						<div className={styles.createTeamWrapper}>
							<input
								type="text"
								className={styles.teamNameInput}
								value={newTeamName}
								onChange={(e) => setNewTeamName(e.target.value)}
								placeholder={t("lobby.newTeamPlaceholder")}
								onKeyDown={(e) =>
									e.key === "Enter" && handleCreateTeam()
								}
							/>
							<RandomDice
								onClick={handleRandomName}
								title={t("lobby.generateRandomTeamName")}
							/>
							<Tooltip text={t("tooltips.addTeam")}>
								<Button
									onClick={handleCreateTeam}
									disabled={!newTeamName.trim()}
									className={styles.addTeamButton}
								>
									<Plus size={16} /> {t("lobby.addTeam")}
								</Button>
							</Tooltip>
						</div>
					)}
				</div>

				<div className={styles.teamsGrid}>
					{game.teams.map((team) => (
						<LobbyTeamView
							key={team.id}
							team={team}
							playersDisplayMap={playersDisplayMap}
						/>
					))}
				</div>

				{game.teams.length === 0 && (
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
			{allAssignedIds.has(user.id) && (
				<div className={styles.toggleReadyContainer}>
					<ToggleGameReadyButton
						roomId={game.id}
						isReady={mePlayer?.isReady || false}
					/>
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
		</div>
	);
}
