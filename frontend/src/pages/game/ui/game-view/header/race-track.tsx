import React from "react";
import { Trophy, Flag } from "lucide-react";
import type { TeamState } from "@entities/game";
import { getDynamicTeamColor } from "../../../api/game-stubs";
import styles from "./race-track.module.css";

interface RaceTrackProps {
	teams: (TeamState & { color?: string })[];
	goal?: number;
}

export function RaceTrack({ teams, goal = 50 }: Readonly<RaceTrackProps>) {
	const safeGoal = Math.max(goal, 1);

	// Sort teams to calculate chip offsets if multiple are at similar score
	const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

	return (
		<div className={styles.trackContainer}>
			<div className={styles.trackHeader}>
				<span>Race to Victory</span>
				<div className={styles.goalLabel}>
					<Trophy size={12} />
					<span>Goal: {safeGoal} pts</span>
				</div>
			</div>

			<div className={styles.trackBase}>
				<div className={styles.milestones}>
					<div className={styles.milestoneTick} />
					<div className={styles.milestoneTick} />
					<div className={styles.milestoneTick} />
					<div className={styles.milestoneTick} />
					<div className={styles.milestoneTick} />
				</div>

				<div className={styles.finishLine} title={`Finish Line (${safeGoal} pts)`}>
					<Flag size={14} />
				</div>

				{sortedTeams.map((team, index) => {
					const percentage = Math.min(Math.max((team.score / safeGoal) * 100, 2), 94);
					const teamColor = getDynamicTeamColor(team, index);

					return (
						<div
							key={team.id}
							className={styles.chipSlot}
							style={{
								left: `${percentage}%`,
								zIndex: index + 1,
							}}
						>
							<div
								className={styles.teamChip}
								style={{ "--team-color": teamColor } as React.CSSProperties}
								title={`${team.name}: ${team.score} pts`}
							>
								<span className={styles.chipName}>{team.name}</span>
								<span className={styles.chipScore}>{team.score}</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
