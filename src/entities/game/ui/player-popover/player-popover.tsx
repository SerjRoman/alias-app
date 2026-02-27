import * as Popover from "@radix-ui/react-popover";
import type { PlayerState } from "@entities/game/model";
import styles from "./player-popover.module.css";
import type { ReactNode } from "react";

interface PlayerPopoverProps {
	player: PlayerState;
	renderTrigger: (player: PlayerState) => ReactNode;
	renderActions?: (player: PlayerState) => ReactNode;
}

export function PlayerPopover({
	player,
	renderTrigger,
	renderActions,
}: Readonly<PlayerPopoverProps>) {
	return (
		<Popover.Root key={player.id}>
			<Popover.Trigger asChild>{renderTrigger(player)}</Popover.Trigger>

			<Popover.Portal>
				<Popover.Content
					className={styles.popoverContent}
					side="right"
					sideOffset={5}
				>
					<div className={styles.popoverHeader}>
						<p className={styles.popoverTitle}>{player.name}</p>
						<p className={styles.popoverText}>
							Score: <strong>{player.score}</strong>
						</p>
						<p className={styles.popoverText}>
							Status:{" "}
							{player.isReady ? "Ready ✅" : "Not Ready ⏳"}
						</p>
						<p className={styles.popoverText}>
							{player.isOnline ? "Online ✅" : "Offline ❌"}
						</p>
						{renderActions?.(player)}
					</div>
					<Popover.Arrow className={styles.popoverArrow} />
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
