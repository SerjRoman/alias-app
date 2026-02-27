import { User } from "lucide-react";
import styles from "./unassigned-players-list.module.css";
import { PlayerPopover } from "@entities/game/ui";
import { KickButton } from "@features/kick-player";
import type { PlayerState } from "@entities/game/model";
import { MovePlayerMenu } from "../move-player-menu/move-player-menu";

interface UnassignedPlayersListProps {
	players: PlayerState[];
	roomId: string;
	isOwner: boolean;
}

export function UnassignedPlayersList({
	players,
	isOwner,
	roomId,
}: Readonly<UnassignedPlayersListProps>) {
	if (players.length === 0) return null;
	const playersMap = new Map(players.map((p) => [p.id, p]));

	return (
		<div className={styles.container}>
			<h4>Spectators / Unassigned</h4>
			<div className={styles.list}>
				{players.map((p) => (
					<PlayerPopover
						key={p.id}
						playerId={p.id}
						playerIsOnline={p.isOnline}
						renderTrigger={(playerId) => {
							return (
								<button
									className={styles.triggerButton}
									tabIndex={0}
								>
									<div key={p.id} className={styles.item}>
										<User
											size={14}
											className={styles.icon}
										/>
										<span>
											{playersMap.get(playerId)?.name}
										</span>
									</div>
								</button>
							);
						}}
						renderActions={(playerId) => {
							const player = playersMap.get(playerId);
							if (!player || !isOwner) return null;
							return (
								<div className={styles.playerActions}>
									<KickButton
										roomId={roomId}
										playerId={player.id}
										playerName={player.name}
									/>
									<MovePlayerMenu playerId={player.id} />
								</div>
							);
						}}
					/>
				))}
			</div>
		</div>
	);
}
