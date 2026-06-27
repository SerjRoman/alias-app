import { Trash2 } from "lucide-react";
import { useLobbyActions } from "../../../api/use-lobby-actions";
import styles from "./lobby-team-view.module.css";
import { useAuth } from "@entities/auth";
import { useMemo } from "react";
import {
	type TeamState,
	useGameSlice,
	TeamCard,
	PlayerPopover,
	type PlayerDisplayInfo,
} from "@entities/game";
import { Button, Tooltip } from "@shared/ui";
import { useTranslation } from "react-i18next";
import { ConfirmationModal, type ConfirmationModalProps } from "@shared/ui/modal";
import { useModal } from "@shared/lib/hooks";

export function LobbyTeamView({
	team,
	playersDisplayMap,
}: Readonly<{
	team: TeamState;
	playersDisplayMap: Map<string, PlayerDisplayInfo>;
}>) {
	const { t } = useTranslation();
	const currentUserId = useAuth((state) => state.user!.id);
	const roomId = useGameSlice((state) => state.game!.id);
	const ownerId = useGameSlice((state) => state.game!.ownerId);
	const players = useGameSlice((state) => state.game!.players);
	const settings = useGameSlice((state) => state.game!.settings);

	const isMyTeam = team.playerIds.includes(currentUserId);
	const isOwner = currentUserId === ownerId;
	const { deleteTeam, joinTeam } = useLobbyActions();
	const playersMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
	const [modalControl, ModalProvider] = useModal<
		Omit<ConfirmationModalProps, "isOpen" | "onClose">
	>();

	const handleDeleteClick = () => {
		modalControl.open({
			title: t("lobby.deleteTeamTitle"),
			message: t("lobby.deleteTeamConfirm", { name: team.name }),
			confirmText: t("common.yes"),
			variant: "danger",
			onConfirm: () => {
				deleteTeam(roomId, team.id);
			},
		});
	};

	return (
		<>
			<TeamCard
				team={team}
				playersMap={playersMap}
				sectionRight={
					isOwner && (
						<Tooltip text={t("tooltips.deleteTeam")}>
							<Button
								className={styles.deleteButton}
								onClick={handleDeleteClick}
								variant="danger"
							>
								<Trash2 size={16} />
							</Button>
						</Tooltip>
					)
				}
				footer={
					isMyTeam ? (
						<div className={styles.joinedText}>{t("lobby.joined")}</div>
					) : (
						<Tooltip text={t("tooltips.joinTeam")} position="bottom">
							<Button
								className={styles.joinButton}
								onClick={() => joinTeam(roomId, team.id)}
							>
								{t("lobby.joinTeam")}
							</Button>
						</Tooltip>
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
								submittedWordsCount={player.submittedWordsCount}
								wordsPerPlayer={settings.wordsPerPlayer}
								isHatMode={settings.isHatMode}
							/>
						</li>
					);
				}}
			/>
			<ModalProvider ModalComponent={ConfirmationModal} />
		</>
	);
}
