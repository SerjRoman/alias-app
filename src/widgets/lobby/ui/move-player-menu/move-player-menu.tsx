import { useGameSlice } from "@entities/game/model";
import styles from "./move-player-menu.module.css";
import { useLobbyActions } from "@widgets/lobby/model";

interface MovePlayerMenuProps {
	playerId: string;
}

export function MovePlayerMenu({ playerId }: Readonly<MovePlayerMenuProps>) {
	const gameId = useGameSlice((state) => state.game!.id);
	const teams = useGameSlice((state) => state.game?.teams);
	const { assignPlayerToTeam } = useLobbyActions();
	if (!teams) return null;

	const availableTeams = teams.filter(
		(team) => !team.playerIds.includes(playerId),
	);

	if (availableTeams.length === 0) return null;

	return (
		<div className={styles.container}>
			<span className={styles.label}>Move to:</span>

			<div className={styles.buttonList}>
				{availableTeams.map((team) => (
					<button
						key={team.id}
						className={styles.actionButton}
						onClick={() =>
							assignPlayerToTeam(gameId, team.id, playerId)
						}
					>
						{team.name}
					</button>
				))}
			</div>
		</div>
	);
}
