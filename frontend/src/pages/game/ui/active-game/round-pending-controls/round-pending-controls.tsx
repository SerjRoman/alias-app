import { useActiveGameActions } from "../../../model";
import { Play } from "lucide-react";
import styles from "./round-pending-controls.module.css";
import { ToggleRoundReadyButton } from "../round-ready-button/round-ready-button";
import { Button } from "@shared/ui/button";

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
				<Button
					onClick={() => startRound(roomId)}
					className={styles.startBtn}
					disabled={!isAllReady}
				>
					<Play fill="white" size={24} />
					{isAllReady ? "Start Round" : "Waiting for teammates..."}
				</Button>
			)}
		</div>
	);
}
