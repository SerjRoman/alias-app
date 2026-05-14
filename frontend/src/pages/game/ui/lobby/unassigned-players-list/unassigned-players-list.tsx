import styles from "./unassigned-players-list.module.css";
import { type PlayerState, PlayerPopover } from "@entities/game";
import { useQuery } from "@shared/api";
import { USER_DEFAULT_AVATAR_URL } from "@shared/lib";

interface UnassignedPlayersListProps {
	players: PlayerState[];
	roomId: string;
}
export function UnassignedPlayersList({
	players,
}: Readonly<UnassignedPlayersListProps>) {
	const { data: playersData } = useQuery("get", "/user/short-info", {
		params: {
			query: { userIds: players.map((p) => p.id) },
		},
	});
	if (players.length === 0 && playersData?.length === 0) return null;
	const playersMap = new Map(players.map((p) => [p.id, p]));
	const playersDataMap = new Map(playersData?.map((p) => [p.id, p]));
	return (
		<div className={styles.container}>
			<h4>Spectators / Unassigned</h4>
			<div className={styles.list}>
				{players.map((p) => (
					<PlayerPopover
						key={p.id}
						playerId={p.id}
						playerIsOnline={p.isOnline}
						playerAvatar={
							playersDataMap.get(p.id)?.avatarUrl ||
							USER_DEFAULT_AVATAR_URL
						}
						playerUsername={
							playersDataMap.get(p.id)?.username || ""
						}
						playerName={
							playersDataMap.get(p.id)?.name ||
							playersMap.get(p.id)?.name ||
							"Unknown Player"
						}
						renderTrigger={(playerId) => {
							return (
								<button
									className={styles.triggerButton}
									tabIndex={0}
								>
									<div key={p.id} className={styles.item}>
										<img
											src={
												playersDataMap.get(p.id)
													?.avatarUrl ||
												import.meta.env
													.VITE_DEFAULT_AVATAR_URL
											}
											alt={playersDataMap.get(p.id)?.name}
											className={styles.avatar}
										/>
										<span>
											{playersDataMap.get(playerId)
												?.name ||
												playersMap.get(playerId)
													?.name ||
												"Unknown Player"}
										</span>
									</div>
								</button>
							);
						}}
					/>
				))}
			</div>
		</div>
	);
}
