import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Crown, FastForward } from "lucide-react";
import type {
	TeamState,
	PlayerState,
	PlayerDisplayInfo,
} from "@entities/game";
import { PlayerRow } from "./player-row";
import styles from "./team-card.module.css";

interface TeamCardProps {
	team: TeamState;
	teamColor: string;
	isActiveTurn: boolean;
	isNextTurn: boolean;
	isLeader: boolean;
	isExpanded: boolean;
	isRoundPending?: boolean;
	isTargetableTeam?: boolean;
	isTargetablePlayers?: boolean;
	players: PlayerState[];
	playersDisplayMap?: Map<string, PlayerDisplayInfo>;
	explainerId?: string;
	activeSpeakerIds: string[];
	onToggle: () => void;
	onSelectTeam?: () => void;
	onSelectPlayer?: (playerId: string) => void;
}

export function TeamCard({
	team,
	teamColor,
	isActiveTurn,
	isNextTurn,
	isLeader,
	isExpanded,
	isRoundPending = false,
	isTargetableTeam = false,
	isTargetablePlayers = false,
	players,
	playersDisplayMap,
	explainerId,
	activeSpeakerIds,
	onToggle,
	onSelectTeam,
	onSelectPlayer,
}: Readonly<TeamCardProps>) {
	const { t } = useTranslation();

	return (
		<div
			className={`${styles.teamCard} ${isActiveTurn ? styles.activeTurn : ""} ${isTargetableTeam ? styles.targetableTeam : ""}`}
			style={
				{
					"--team-color": teamColor,
					"--team-glow": `${teamColor}40`,
				} as CSSProperties
			}
		>
			{/* Clickable Header Accordion / Target Row */}
			<div
				className={`${styles.teamHeader} ${isTargetableTeam ? styles.targetableHeader : ""}`}
				role="button"
				tabIndex={0}
				onClick={isTargetableTeam ? onSelectTeam : onToggle}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						if (isTargetableTeam) {
							onSelectTeam?.();
						} else {
							onToggle();
						}
					}
				}}
			>
				<div className={styles.teamIdentity}>
					<div className={styles.teamColorBar} />
					<span className={styles.teamName}>{team.name}</span>

					{/* Leader Crown Icon */}
					{isLeader && (
						<span title={t("gameView.leaderTooltip")}>
							<Crown size={15} className={styles.crownIcon} />
						</span>
					)}

					{/* Next Turn Icon Badge */}
					{isNextTurn && (
						<span
							className={styles.nextTurnBadge}
							title={t("gameView.nextTurnTooltip")}
						>
							<FastForward size={12} />
							<span>{t("gameView.next")}</span>
						</span>
					)}
				</div>

				<div className={styles.teamMetrics}>
					<span className={styles.teamScoreBadge}>
						{team.score} {t("gameView.pts")}
					</span>
					<button
						type="button"
						className={styles.expandBtn}
						aria-label={
							isExpanded ? "Collapse team" : "Expand team"
						}
						onClick={(e) => {
							e.stopPropagation();
							onToggle();
						}}
					>
						<ChevronDown
							size={16}
							className={`${styles.chevron} ${
								isExpanded ? styles.expanded : ""
							}`}
						/>
					</button>
				</div>
			</div>

			{/* Collapsible Players List */}
			{isExpanded && (
				<div className={styles.playersList}>
					{players.map((player) => (
						<PlayerRow
							key={player.id}
							player={player}
							displayInfo={playersDisplayMap?.get(player.id)}
							isExplaining={isActiveTurn && player.id === explainerId}
							isSpeaking={activeSpeakerIds.includes(player.id)}
							isRoundReady={
								isRoundPending &&
								isActiveTurn &&
								player.isRoundReady
							}
							isTargetable={isTargetablePlayers}
							onSelect={() => onSelectPlayer?.(player.id)}
							showScore={true}
						/>
					))}
				</div>
			)}
		</div>
	);
}
