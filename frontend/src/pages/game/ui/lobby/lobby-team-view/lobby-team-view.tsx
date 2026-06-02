import { Trash2 } from "lucide-react";
import { useLobbyActions } from "../../../api/use-lobby-actions";
import styles from "./lobby-team-view.module.css";
import { useAuth } from "@entities/auth";
import {
	type TeamState,
	useGameSlice,
	TeamCard,
	PlayerPopover,
	usePlayersDisplayMap,
} from "@entities/game";
import { Button } from "@shared/ui/button";
import { useTranslation } from "react-i18next";

export function LobbyTeamView({
	team,
}: Readonly<{
	team: TeamState;
}>) {
	const { t } = useTranslation();
	const currentUserId = useAuth((state) => state.user!.id);
	const roomId = useGameSlice((state) => state.game!.id);
	const ownerId = useGameSlice((state) => state.game!.ownerId);
	const players = useGameSlice((state) => state.game!.players);

	const isMyTeam = team.playerIds.includes(currentUserId);
	const isOwner = currentUserId === ownerId;
	const { deleteTeam, joinTeam } = useLobbyActions();
	const playersMap = new Map(players.map((p) => [p.id, p]));
	const playersDisplayMap = usePlayersDisplayMap(players);
	return (
		<TeamCard
			team={team}
			playersMap={playersMap}
			sectionRight={
				isOwner && (
					<Button
						className={styles.deleteButton}
						onClick={() => deleteTeam(roomId, team.id)}
						title={t("lobby.deleteTeamTooltip")}
						variant="danger"
					>
						<Trash2 size={16} />
					</Button>
				)
			}
			footer={
				isMyTeam ? (
					<div className={styles.joinedText}>{t("lobby.joined")}</div>
				) : (
					<Button
						className={styles.joinButton}
						onClick={() => joinTeam(roomId, team.id)}
					>
						{t("lobby.joinTeam")}
					</Button>
				)
			}
			renderPlayer={(player) => {
				const playerDisplayInfo = playersDisplayMap.get(player.id);
				return (
					<li key={player.id}>
						<PlayerPopover
							playerId={player.id}
							playerIsOnline={player.isOnline}
							playerIsReady={player.isReady}
							playerIsOwner={player.id === ownerId}
							playerAvatar={playerDisplayInfo?.avatarUrl}
							playerUsername={playerDisplayInfo?.username}
							playerName={
								playerDisplayInfo?.name ||
								player.name ||
								t("playerPopover.unknownPlayer")
							}
							triggerClassName={styles.triggerButton}
						/>
					</li>
				);
			}}
		/>
	);
}
