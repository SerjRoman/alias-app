import { useState } from "react";
import { Plus, Play } from "lucide-react";
import { type GameStateDetails } from "../../../entities/game/model";
import { socketClient } from "../../../shared/api/socket";
import { SettingsPanel } from "./settings-panel/settings-panel";
import { TeamCard } from "./team-card/team-card";
import { UnassignedPlayersList } from "./unassigned-players-list/unassigned-players-list";
import styles from "./lobby-view.module.css";

type LobbyProps = {
	game: GameStateDetails;
	isOwner: boolean;
	userId: string;
};

export function LobbyView({ game, isOwner, userId }: Readonly<LobbyProps>) {
	const [newTeamName, setNewTeamName] = useState("");
	const handleCreateTeam = () => {
		if (!newTeamName.trim()) return;
		socketClient.emit("createTeam", {
			roomId: game.id,
			teamName: newTeamName,
		});
		setNewTeamName("");
	};

	const handleDeleteTeam = (teamId: string) => {
		if (confirm("Delete this team?")) {
			socketClient.emit("deleteTeam", { roomId: game.id, teamId });
		}
	};

	const handleJoinTeam = (teamId: string) => {
		socketClient.emit("moveToTeam", { roomId: game.id, teamId });
	};

	const handleStartGame = () => {
		socketClient.emit("startGame", { roomId: game.id });
	};

	const playersMap = new Map(game.players.map((p) => [p.id, p]));

	return (
		<div className={styles.container}>
			<SettingsPanel game={game} isOwner={isOwner} />
			<div className={styles.teamContainer}>
				<div className={styles.teamList}>
					<h2>Teams</h2>
					{isOwner && (
						<div
							style={{
								display: "flex",
								gap: 10,
								justifyContent: "center",
							}}
						>
							<input
								type="text"
								value={newTeamName}
								onChange={(e) => setNewTeamName(e.target.value)}
								placeholder="New Team Name"
								style={{
									padding: "5px 10px",
									borderRadius: 4,
									border: "1px solid #ccc",
								}}
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

				<div
					style={{
						display: "grid",
						gridTemplateColumns:
							"repeat(auto-fill, minmax(250px, 1fr))",
						gap: 20,
					}}
				>
					{game.teams.map((team) => (
						<TeamCard
							key={team.id}
							team={team}
							playersMap={playersMap}
							isOwner={isOwner}
							currentUserId={userId}
							onJoin={() => handleJoinTeam(team.id)}
							onDelete={() => handleDeleteTeam(team.id)}
						/>
					))}
				</div>

				{game.teams.length === 0 && (
					<p style={{ textAlign: "center", color: "#888" }}>
						No teams created yet.
					</p>
				)}
			</div>

			<UnassignedPlayersList game={game} />

			{isOwner && (
				<div className={styles.startGameContainer}>
					<button
						onClick={handleStartGame}
						className={styles.startGameButton}
						disabled={game.teams.length < 2}
					>
						<Play fill="currentColor" /> Start Game
					</button>
				</div>
			)}
		</div>
	);
}
