import {
	type TeamState,
	useGameSlice,
	TeamCard,
	PlayerPopover,
	usePlayersDisplayMap,
} from "@entities/game";
import styles from "./team-view.module.css";

interface TeamViewProps {
	team: TeamState;
	isOwner: boolean;
	roomId: string;
}

export function ActiveGameTeamView({ team }: Readonly<TeamViewProps>) {
	const players = useGameSlice((state) => state.game!.players);
	const ownerId = useGameSlice((state) => state.game!.ownerId);
	const currentGuesserId = useGameSlice(
		(state) => state.game?.currentRound?.guesserId,
	);
	const playersMap = new Map(players.map((p) => [p.id, p]));
	const playersDisplayMap = usePlayersDisplayMap(players);
	const isPlayingTeam = team.playerIds.includes(currentGuesserId!);
	return (
		<TeamCard
			team={team}
			sectionRight={<span>Score: {team.score}</span>}
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
							triggerClassName={styles.triggerButton}
						/>
					</li>
				);
			}}
		/>
	);
}
