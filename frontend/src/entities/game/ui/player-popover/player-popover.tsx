import * as Popover from "@radix-ui/react-popover";
import styles from "./player-popover.module.css";
import type { ReactNode } from "react";

interface PlayerPopoverProps {
	renderTrigger: (playerId: string) => ReactNode;
	renderActions?: (playerId: string) => ReactNode;
	playerId: string;
	playerScore?: number;
	playerName?: string;
	playerIsOnline?: boolean;
}

export function PlayerPopover({
	renderTrigger,
	renderActions,
	playerId,
	playerIsOnline,
	playerName,
	playerScore,
}: Readonly<PlayerPopoverProps>) {
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
						{playerName && (
							<p className={styles.popoverTitle}>{playerName}</p>
						)}
						{playerScore != undefined && (
							<p className={styles.popoverText}>
								Score: <strong>{playerScore}</strong>
							</p>
						)}

						{playerIsOnline && (
							<p className={styles.popoverText}>
								{playerIsOnline ? "Online ✅" : "Offline ❌"}
							</p>
						)}
						{renderActions?.(playerId)}
					</div>
					<Popover.Arrow className={styles.popoverArrow} />
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
