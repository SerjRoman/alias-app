import { useTranslation } from "react-i18next";
import { ChevronDown, Eye } from "lucide-react";
import type { PlayerState, PlayerDisplayInfo } from "@entities/game";
import { Button } from "@shared/ui";
import { PlayerRow } from "./player-row";
import styles from "./spectators-card.module.css";

interface SpectatorsCardProps {
	spectators: PlayerState[];
	playersDisplayMap?: Map<string, PlayerDisplayInfo>;
	isExpanded: boolean;
	activeSpeakerIds?: string[];
	onToggle: () => void;
}

export function SpectatorsCard({
	spectators,
	playersDisplayMap,
	isExpanded,
	activeSpeakerIds = [],
	onToggle,
}: Readonly<SpectatorsCardProps>) {
	const { t } = useTranslation();

	return (
		<div className={styles.spectatorsCard}>
			<Button
				type="button"
				variant="secondary"
				className={styles.teamHeader}
				onClick={onToggle}
			>
				<div className={styles.teamIdentity}>
					<div className={styles.spectatorIconWrapper}>
						<Eye size={14} />
					</div>
					<span className={styles.spectatorTitle}>
						{t("gameView.spectators")}
					</span>
				</div>

				<div className={styles.teamMetrics}>
					<ChevronDown
						size={16}
						className={`${styles.chevron} ${
							isExpanded ? styles.expanded : ""
						}`}
					/>
				</div>
			</Button>

			{isExpanded && (
				<div className={styles.playersList}>
					{spectators.map((player) => (
						<PlayerRow
							key={player.id}
							player={player}
							displayInfo={playersDisplayMap?.get(player.id)}
							isSpeaking={activeSpeakerIds.includes(player.id)}
							showScore={false}
						/>
					))}
				</div>
			)}
		</div>
	);
}
