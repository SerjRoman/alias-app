import { Trash2 } from "lucide-react";
import { useLobbyActions } from "../../../model/use-lobby-actions";
import styles from "./lobby-team-view.module.css";
import { useAuth } from "@entities/auth";
import {
	type TeamState,
	useGameSlice,
	TeamCard,
	PlayerPopover,
	PlayerItem,
} from "@entities/game";

export function LobbyTeamView({
	team,
}: Readonly<{
	team: TeamState;
}>) {
	const currentUserId = useAuth((state) => state.user!.id);
	const roomId = useGameSlice((state) => state.game!.id);
	const ownerId = useGameSlice((state) => state.game!.ownerId);
	const players = useGameSlice((state) => state.game!.players);

	const isMyTeam = team.playerIds.includes(currentUserId);
	const isOwner = currentUserId === ownerId;
	const { deleteTeam, joinTeam } = useLobbyActions();
	const playersMap = new Map(players.map((p) => [p.id, p]));
	return (
		<TeamCard
			team={team}
			playersMap={playersMap}
			sectionRight={
				isOwner && (
					<button
						className={styles.deleteButton}
						onClick={() => deleteTeam(roomId, team.id)}
						title="Delete team"
					>
						<Trash2 size={16} />
					</button>
				)
			}
			footer={
				isMyTeam ? (
					<div className={styles.joinedText}>Joined</div>
				) : (
					<button
						className={styles.joinButton}
						onClick={() => joinTeam(roomId, team.id)}
					>
						Join Team
					</button>
				)
			}
			renderPlayer={(player) => {
				return (
					<PlayerPopover
						key={player.id}
						playerId={player.id}
						playerIsOnline={player.isOnline}
						playerName={player.name}
						renderTrigger={(playerId) => {
							const player = playersMap.get(playerId);
							if (!player) return null;
							const isPlayerOwner = player.id === ownerId;

							return (
								<button
									className={styles.triggerButton}
									tabIndex={0}
								>
									<PlayerItem
										id={player.id}
										name={player.name}
										isOwner={isPlayerOwner}
										isReady={player.isReady}
										isGuesser={false}
										isOnline={player.isOnline}
									/>
								</button>
							);
						}}
					/>
				);
			}}
		/>
	);
}
