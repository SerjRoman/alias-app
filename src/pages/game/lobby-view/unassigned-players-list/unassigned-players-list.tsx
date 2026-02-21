import { User } from "lucide-react";
import type { GameStateDetails } from "../../../../entities/game/model";
import styles from "./unassigned-players-list.module.css";
export function UnassignedPlayersList({
	game,
}: Readonly<{ game: GameStateDetails }>) {
	const allAssignedIds = new Set(game.teams.flatMap((t) => t.playerIds));
	const unassignedPlayers = game.players.filter(
		(p) => !allAssignedIds.has(p.id),
	);

	if (unassignedPlayers.length === 0) return null;

	return (
		<div className={styles.container}>
			<h4>Spectators / Unassigned</h4>
			<div className={styles.list}>
				{unassignedPlayers.map((p) => (
					<div
						key={p.id}
						style={{
							
						}}
					>
						<User size={14} /> {p.name}
					</div>
				))}
			</div>
		</div>
	);
}
