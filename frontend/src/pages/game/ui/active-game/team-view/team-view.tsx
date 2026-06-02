import {
	type TeamState,
	useGameSlice,
	TeamCard,
	PlayerPopover,
	usePlayersDisplayMap,
	getVoiceParticipantUserId,
} from "@entities/game";
import styles from "./team-view.module.css";
import { useSpeakingParticipants, useMaybeRoomContext } from "@livekit/components-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface TeamViewProps {
	team: TeamState;
	isOwner: boolean;
	roomId: string;
}

function ActiveSpeakingPlayerIdsWatcher({
	onChange,
}: Readonly<{
	onChange: (ids: Set<string>) => void;
}>) {
	const speakingParticipants = useSpeakingParticipants();
	useEffect(() => {
		const speakingPlayerIds = new Set(
			speakingParticipants.map((participant) =>
				getVoiceParticipantUserId(participant.identity),
			),
		);
		onChange(speakingPlayerIds);
	}, [speakingParticipants, onChange]);

	return null;
}

export function ActiveGameTeamView({ team }: Readonly<TeamViewProps>) {
	const players = useGameSlice((state) => state.game!.players);
	const ownerId = useGameSlice((state) => state.game!.ownerId);
    const {t} = useTranslation()
	const currentGuesserId = useGameSlice(
		(state) => state.game?.currentRound?.guesserId,
	);
	const playersMap = new Map(players.map((p) => [p.id, p]));
	const playersDisplayMap = usePlayersDisplayMap(players);
	const isPlayingTeam = team.playerIds.includes(currentGuesserId!);

	const roomContext = useMaybeRoomContext();
	const [speakingPlayerIds, setSpeakingPlayerIds] = useState<Set<string>>(
		() => new Set(),
	);

	return (
		<>
			{roomContext && (
				<ActiveSpeakingPlayerIdsWatcher onChange={setSpeakingPlayerIds} />
			)}
			<TeamCard
				team={team}
				sectionRight={<span>{t("activeGame.score", { score: team.score })}</span>}
				playersMap={playersMap}
				isPlayingTeam={isPlayingTeam}
				renderPlayer={(player) => {
					const playerDisplayInfo = playersDisplayMap.get(player.id);
					return (
						<li key={player.id}>
							<PlayerPopover
								playerId={player.id}
								playerIsOnline={player.isOnline}
								playerName={
									playerDisplayInfo?.name ||
									player.name ||
									"Unknown Player"
								}
								playerAvatar={playerDisplayInfo?.avatarUrl}
								playerUsername={playerDisplayInfo?.username}
								playerScore={player.score}
								playerIsOwner={player.id === ownerId}
								playerIsGuesser={player.id === currentGuesserId}
								playerIsReady={player.isRoundReady}
								playerIsSpeaking={speakingPlayerIds.has(player.id)}
								triggerClassName={styles.triggerButton}
							/>
						</li>
					);
				}}
			/>
		</>
	);
}

