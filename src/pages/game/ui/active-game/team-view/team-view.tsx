import {
	type TeamState,
	useGameSlice,
	TeamCard,
	PlayerPopover,
	PlayerItem,
} from "@entities/game";
import styles from "./team-view.module.css";
import { KickButton } from "../../kick-button/kick-button";

interface TeamViewProps {
	team: TeamState;
	isOwner: boolean;
	roomId: string;
}

export function ActiveGameTeamView({
	team,
	isOwner,
	roomId,
}: Readonly<TeamViewProps>) {
	const players = useGameSlice((state) => state.game!.players);
	const ownerId = useGameSlice((state) => state.game!.ownerId);
	const currentRound = useGameSlice((state) => state.game!.currentRound!);
	const playersMap = new Map(players.map((p) => [p.id, p]));

	return (
		<TeamCard
			team={team}
			sectionRight={<span>Score: {team.score}</span>}
			playersMap={playersMap}
			renderPlayer={(player) => {
				return (
					<PlayerPopover
						key={player.id}
						playerId={player.id}
						playerIsOnline={player.isOnline}
						playerName={player.name}
						playerScore={player.score}
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
								</div>
							);
						}}
						renderTrigger={(playerId) => {
							const player = playersMap.get(playerId);
							if (!player) return null;

							const isPlayerOwner = player.id === ownerId;
							const isGuesser =
								currentRound.guesserId === player.id;
							return (
								<button
									className={styles.triggerButton}
									tabIndex={0}
								>
									<PlayerItem
										id={player.id}
										name={player.name}
										isOwner={isPlayerOwner}
										isReady={player.isRoundReady}
										isGuesser={isGuesser}
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
