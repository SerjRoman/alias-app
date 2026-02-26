import styles from "./team-card.module.css";
import type { ReactNode } from "react";
import type { PlayerState, TeamState } from "../../model";

interface TeamCardProps {
	team: TeamState;
	playersMap: Map<string, PlayerState>;
	actionRight?: ReactNode;
	footer?: ReactNode;
	renderPlayer: (player: PlayerState) => ReactNode;
}

export function TeamCard({
	team,
	playersMap,
	renderPlayer,
	actionRight,
	footer,
}: Readonly<TeamCardProps>) {
	return (
		<div className={styles.card}>
			<div className={styles.header}>
				<h3 className={styles.title}>{team.name}</h3>
				{actionRight && (
					<div className={styles.actionRight}>{actionRight}</div>
				)}
			</div>

			<ul className={styles.playerList}>
				{team.playerIds.map((playerId) => {
					const player = playersMap.get(playerId);
					if (!player) return null;
					return renderPlayer(player);
				})}
				{team.playerIds.length === 0 && (
					<li className={styles.emptyState}>Empty</li>
				)}
			</ul>

			{footer && <div className={styles.footer}>{footer}</div>}
		</div>
	);
}
