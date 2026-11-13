import type React from "react";
import { useTranslation } from "react-i18next";
import * as Popover from "@radix-ui/react-popover";
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "../../avatar";
import styles from "./player-profile-popover.module.css";

interface PlayerProfilePopoverProps {
	playerId: string;
	name: string;
	username?: string;
	avatarUrl?: string;
	isRegistered: boolean;
	children: React.ReactNode;
}

export function PlayerProfilePopover({
	playerId,
	name,
	username,
	avatarUrl,
	isRegistered,
	children,
}: Readonly<PlayerProfilePopoverProps>) {
	const { t } = useTranslation();

	return (
		<Popover.Root>
			<Popover.Trigger asChild>{children}</Popover.Trigger>
			<Popover.Portal>
				<Popover.Content
					className={styles.popoverContent}
					side="right"
					align="start"
					sideOffset={8}
					collisionPadding={12}
				>
					<div className={styles.header}>
						<Avatar src={avatarUrl} name={name} size={44} />
						<div className={styles.identity}>
							<span className={styles.name}>{name}</span>
							{username ? (
								<span className={styles.username}>
									@{username}
								</span>
							) : (
								!isRegistered && (
									<span className={styles.guestBadge}>
										{t("gameView.guest")}
									</span>
								)
							)}
						</div>
					</div>

					{isRegistered && (
						<Link
							to={`/profile/${playerId}`}
							className={styles.profileLink}
						>
							<span>{t("gameView.openProfile")}</span>
							<ExternalLink size={13} />
						</Link>
					)}

					<Popover.Arrow className={styles.popoverArrow} />
				</Popover.Content>
			</Popover.Portal>
		</Popover.Root>
	);
}
