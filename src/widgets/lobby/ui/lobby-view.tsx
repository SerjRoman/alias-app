import { useGameSlice } from "@entities/game/model";
import { Plus, Play } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./lobby-view.module.css";
import { SettingsPanel } from "./settings-panel/settings-panel";
import { LobbyTeamView } from "./lobby-team-view/lobby-team-view";
import { UnassignedPlayersList } from "./unassigned-players-list/unassigned-players-list";
import { useLobbyActions } from "../model";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@entities/auth/model";
import { ToggleGameReadyButton } from "@features/toggle-ready/ui";
import { socketClient } from "@shared/api/socket";

export function LobbyView() {
	const [newTeamName, setNewTeamName] = useState("");
	const { game } = useGameSlice();
	const { user } = useAuth();
	const { createTeam, startGame } = useLobbyActions();
	const navigate = useNavigate();
	useEffect(() => {
		function handlePlayerKicked({
			kickedUserId,
		}: {
			kickedUserId: string;
		}) {
			if (kickedUserId === user?.id) {
				alert("You were kicked");
				navigate("/games");
			}
		}
		socketClient.on("playerKicked", handlePlayerKicked);
		return () => {
			socketClient.off("playerKicked", handlePlayerKicked);
		};
	}, [user, navigate]);
	if (!game || !user) {
		navigate("/games");
		return null;
	}
	function handleCreateTeam() {
		if (!newTeamName.trim() || !game) return;
		createTeam(game.id, newTeamName);
		setNewTeamName("");
	}

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
				isOwner={isOwner}
			/>

			<div className={styles.teamContainer}>
				<div className={styles.teamListHeader}>
					<h2>Teams</h2>
					{isOwner && (
						<div className={styles.createTeamWrapper}>
							<input
								type="text"
								className={styles.teamNameInput}
								value={newTeamName}
								onChange={(e) => setNewTeamName(e.target.value)}
								placeholder="New Team Name"
								onKeyDown={(e) =>
									e.key === "Enter" && handleCreateTeam()
								}
							/>
							<button
								onClick={handleCreateTeam}
								disabled={!newTeamName.trim()}
								className={styles.addTeamButton}
							>
								<Plus size={16} /> Add
							</button>
						</div>
					)}
				</div>

				<div className={styles.teamsGrid}>
					{game.teams.map((team) => (
						<LobbyTeamView key={team.id} team={team} />
					))}
				</div>

				{game.teams.length === 0 && (
					<p className={styles.emptyMessage}>No teams created yet.</p>
				)}
			</div>
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
					<button
						onClick={() => startGame(game.id)}
						className={styles.startGameButton}
						disabled={game.teams.length < 2 || !isAllReady}
					>
						<Play fill="currentColor" size={20} /> Start Game
					</button>
				</div>
			)}
		</div>
	);
}
