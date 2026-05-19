import * as Popover from "@radix-ui/react-popover";
import styles from "./player-popover.module.css";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Volume2 } from "lucide-react";
import { USER_DEFAULT_AVATAR_URL } from "@shared/lib";

interface PlayerPopoverProps {
	renderActions?: (playerId: string) => ReactNode;
	playerId: string;
	playerScore?: number;
	playerName?: string;
	playerIsOnline?: boolean;
	playerIsReady?: boolean;
	playerIsOwner?: boolean;
	playerIsGuesser?: boolean;
	playerIsSpeaking?: boolean;
	playerAvatar?: string;
	playerUsername?: string;
	triggerClassName?: string;
}

export function PlayerPopover({
	renderActions,
	playerId,
	playerIsOnline,
	playerIsReady,
	playerIsOwner,
	playerIsGuesser,
	playerIsSpeaking,
	playerName,
	playerScore,
	playerAvatar,
	playerUsername,
	triggerClassName,
}: Readonly<PlayerPopoverProps>) {
	const navigate = useNavigate();
	const displayName = playerName || "Unknown Player";
	const displayAvatar = playerAvatar || USER_DEFAULT_AVATAR_URL;
	const triggerClassNames = [styles.triggerButton, triggerClassName]
		.filter(Boolean)
		.join(" ");
	const triggerItemClassNames = [
		styles.triggerItem,
		playerIsReady ? styles.ready : "",
		playerIsOnline === false ? styles.offline : "",
		playerIsSpeaking ? styles.speaking : "",
	]
		.filter(Boolean)
		.join(" ");
	const shouldShowMeta = playerIsOwner || playerIsGuesser || playerIsSpeaking;

	return (
		<Popover.Root>
			<Popover.Trigger asChild>
				<button type="button" className={triggerClassNames} tabIndex={0}>
					<div className={triggerItemClassNames}>
						<img
							src={displayAvatar}
							alt={displayName}
							className={styles.triggerAvatar}
						/>
						<span className={styles.triggerName}>{displayName}</span>
						{shouldShowMeta && (
							<div className={styles.triggerMeta}>
								{playerIsSpeaking && (
									<Volume2
										size={14}
										className={styles.speakingIcon}
										aria-label="Speaking"
									/>
								)}
								{playerIsOwner && (
									<Crown
										size={14}
										className={styles.ownerIcon}
										fill="currentColor"
										aria-label="Room Owner"
									/>
								)}
								{playerIsGuesser && (
									<ArrowLeft
										size={16}
										className={styles.guesserIcon}
										strokeWidth={2.5}
										aria-label="Current Guesser"
									/>
								)}
							</div>
						)}
					</div>
				</button>
			</Popover.Trigger>

			<Popover.Portal>
				<Popover.Content
					className={styles.popoverContent}
					side="right"
					sideOffset={5}
				>
					<div className={styles.popoverHeader}>
						<div className={styles.userProfile}>
							<img
								src={displayAvatar}
								alt={displayName}
								className={styles.popoverAvatar}
							/>
							<div className={styles.userInfo}>
								<p className={styles.popoverTitle}>
									{displayName}
								</p>
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

								{playerIsOnline != undefined && (
									<p className={styles.popoverText}>
										{playerIsOnline
											? "Online ✅"
											: "Offline ❌"}
									</p>
								)}
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
