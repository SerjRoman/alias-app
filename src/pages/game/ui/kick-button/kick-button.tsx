import { UserMinus } from "lucide-react";
import styles from "./kick-button.module.css";
import { kickPlayer } from "../../api/kick-player";

interface KickButtonProps {
	roomId: string;
	playerId: string;
	playerName: string;
}

export function KickButton({
	roomId,
	playerId,
	playerName,
}: Readonly<KickButtonProps>) {
	const handleKick = () => {
		if (confirm(`Are you sure you want to kick ${playerName}?`)) {
			kickPlayer(roomId, playerId);
		}
	};

	return (
		<button
			className={styles.kickButton}
			onClick={handleKick}
			title="Kick player from the room"
		>
			<UserMinus size={16} strokeWidth={2.5} />
			<span>Kick Player</span>
		</button>
	);
}
