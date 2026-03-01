import { ToggleRoundReadyButton } from "@features/toggle-ready/ui";
import { useActiveGameActions } from "../../model/use-active-game-actions";
import { Play } from "lucide-react";
import styles from "./round-pending-controls.module.css";

interface RoundPendingControlsProps {
	roomId: string;
	isMyTeamPlaying: boolean;
	isGuesser: boolean;
	isAllReady: boolean;
	myReadyState: boolean;
}

export function RoundPendingControls({
	roomId,
	isMyTeamPlaying,
	isGuesser,
	isAllReady,
	myReadyState,
}: Readonly<RoundPendingControlsProps>) {
	const { startRound } = useActiveGameActions();

	return (
		<div className={styles.container}>
			<h2>Prepare for the Round</h2>
			{isMyTeamPlaying ? (
				<ToggleRoundReadyButton
					roomId={roomId}
					isReady={myReadyState}
				/>
			) : (
				<p className={styles.spectatorMessage}>
					Waiting for the playing team to be ready...
				</p>
			)}

			{isGuesser && (
				<button
					onClick={() => startRound(roomId)}
					className={styles.startBtn}
					disabled={!isAllReady}
				>
					<Play fill="currentColor" size={24} />
					{isAllReady ? "START ROUND" : "Waiting for teammates..."}
				</button>
			)}
		</div>
	);
}
