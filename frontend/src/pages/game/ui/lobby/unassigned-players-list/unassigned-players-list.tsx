import styles from "./unassigned-players-list.module.css";
import {
	type PlayerState,
	PlayerPopover,
	useGameSlice,
	usePlayersDisplayMap,
} from "@entities/game";
import { useTranslation } from "react-i18next";

interface UnassignedPlayersListProps {
	players: PlayerState[];
	roomId: string;
}
export function UnassignedPlayersList({
	players,
}: Readonly<UnassignedPlayersListProps>) {
	const { t } = useTranslation();
	const ownerId = useGameSlice((state) => state.game!.ownerId);
	const playersDisplayMap = usePlayersDisplayMap(players);
	if (players.length === 0) return null;

	return (
		<div className={styles.container}>
			<h4>{t("lobby.spectators")}</h4>
			<div className={styles.list}>
				{players.map((p) => {
					const playerDisplayInfo = playersDisplayMap.get(p.id);
					return (
						<PlayerPopover
							key={p.id}
							playerId={p.id}
							playerIsOnline={p.isOnline}
							playerIsReady={p.isReady}
							playerIsOwner={p.id === ownerId}
							playerAvatar={playerDisplayInfo?.avatarUrl}
							playerUsername={playerDisplayInfo?.username}
							playerName={
								playerDisplayInfo?.name ||
								p.name ||
								t("playerPopover.unknownPlayer")
							}
						/>
					);
				})}
			</div>
		</div>
	);
}
