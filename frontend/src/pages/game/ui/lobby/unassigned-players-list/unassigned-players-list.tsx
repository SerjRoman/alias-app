import styles from "./unassigned-players-list.module.css";
import {
	type PlayerState,
	PlayerPopover,
	useGameSlice,
	type PlayerDisplayInfo,
} from "@entities/game";
import { useTranslation } from "react-i18next";

interface UnassignedPlayersListProps {
	players: PlayerState[];
	roomId: string;
	playersDisplayMap: Map<string, PlayerDisplayInfo>;
}
export function UnassignedPlayersList({
	players,
	playersDisplayMap,
}: Readonly<UnassignedPlayersListProps>) {
	const { t } = useTranslation();
	const ownerId = useGameSlice((state) => state.game!.ownerId);
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
