import { useGameSlice, type TeamState } from "@entities/game/model";
import { PlayerItem, PlayerPopover, TeamCard } from "@entities/game/ui";
import styles from "./team-view.module.css";

export function ActiveGameTeamView({ team }: Readonly<{ team: TeamState }>) {
	const players = useGameSlice((state) => state.game!.players);
	const ownerId = useGameSlice((state) => state.game!.ownerId);
	const currentRound = useGameSlice((state) => state.game!.currentRound!);
	const playersMap = new Map(players.map((p) => [p.id, p]));
	const isPlayingTeam = currentRound.teamId === team.id;
	return (
		<TeamCard
			team={team}
			playersMap={playersMap}
			footer={
				isPlayingTeam && (
					<div>The team {team.name} plays in the round</div>
				)
			}
			renderPlayer={(player) => {
				return (
					<PlayerPopover
						key={player.id}
						player={player}
						renderTrigger={(player) => {
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
