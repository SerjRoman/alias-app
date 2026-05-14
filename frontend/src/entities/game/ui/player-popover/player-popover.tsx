import * as Popover from "@radix-ui/react-popover";
import styles from "./player-popover.module.css";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface PlayerPopoverProps {
	renderTrigger: (playerId: string) => ReactNode;
	renderActions?: (playerId: string) => ReactNode;
	playerId: string;
	playerScore?: number;
	playerName?: string;
	playerIsOnline?: boolean;
	playerAvatar?: string;
	playerUsername?: string;
}

export function PlayerPopover({
	renderTrigger,
	renderActions,
	playerId,
	playerIsOnline,
	playerName,
	playerScore,
	playerAvatar,
	playerUsername,
}: Readonly<PlayerPopoverProps>) {
	const navigate = useNavigate();
	return (
		<Popover.Root key={playerId}>
			<Popover.Trigger asChild>{renderTrigger(playerId)}</Popover.Trigger>

			<Popover.Portal>
				<Popover.Content
					className={styles.popoverContent}
					side="right"
					sideOffset={5}
				>
					<div className={styles.popoverHeader}>
						<div className={styles.userProfile}>
							{playerAvatar && (
								<img
									src={playerAvatar}
									alt={playerName}
									className={styles.avatar}
								/>
							)}
							<div className={styles.userInfo}>
								{playerName && (
									<p className={styles.popoverTitle}>
										{playerName}
									</p>
								)}
								{playerUsername && (
									<p className={styles.popoverText}>
										@{playerUsername}
									</p>
								)}
								{playerScore != undefined && (
									<p className={styles.popoverText}>
										Score: <strong>{playerScore}</strong>
									</p>
								)}

								<p className={styles.popoverText}>
									{playerIsOnline
										? "Online ✅"
										: "Offline ❌"}
								</p>
							</div>
						</div>
						{playerUsername && (
							<button
								className={styles.buttonViewProfile}
								onClick={() => navigate(`/profile/${playerId}`)}
							>
								View profile
							</button>
						)}
						{renderActions?.(playerId)}
					</div>
					<Popover.Arrow className={styles.popoverArrow} />
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
