import React, { useState, useMemo } from "react";
import { Mic, ChevronDown, Users, Crown, FastForward, Eye } from "lucide-react";
import type { GameStateDetails, TeamState, PlayerState } from "@entities/game";
import { getDynamicTeamColor } from "../../../api/game-stubs";
import styles from "./left-sidebar.module.css";

interface LeftSidebarProps {
	game: GameStateDetails;
	activeSpeakerIds?: string[];
}

export function LeftSidebar({
	game,
	activeSpeakerIds = ["p-1", "p-6"],
}: Readonly<LeftSidebarProps>) {
	const activeTurnTeamId = game.currentRound?.teamId ?? game.teams[0]?.id;
	const explainerId = game.currentRound?.explainerId;

	// Calculate leader (team with highest score)
	const maxScore = useMemo(
		() => Math.max(...game.teams.map((t) => t.score)),
		[game.teams],
	);

	// Calculate which team is next in turn order
	const nextTeamId = useMemo(() => {
		const activeIndex = game.teams.findIndex((t) => t.id === activeTurnTeamId);
		if (activeIndex < 0 || game.teams.length <= 1) return null;
		const nextIndex = (activeIndex + 1) % game.teams.length;
		return game.teams[nextIndex]?.id ?? null;
	}, [game.teams, activeTurnTeamId]);

	// Active team is ALWAYS on top, followed by the remaining teams in turn order
	const orderedTeams = useMemo(() => {
		const active = game.teams.find((t) => t.id === activeTurnTeamId);
		const others = game.teams.filter((t) => t.id !== activeTurnTeamId);
		return active ? [active, ...others] : game.teams;
	}, [game.teams, activeTurnTeamId]);

	// State for which teams have their player list expanded.
	// Active team is expanded by default, but CAN be collapsed/hidden by clicking its header.
	const [expandedTeamIds, setExpandedTeamIds] = useState<Record<string, boolean>>({
		[activeTurnTeamId]: true,
	});

	const toggleTeam = (teamId: string) => {
		setExpandedTeamIds((prev) => {
			const currentlyExpanded = prev[teamId] ?? (teamId === activeTurnTeamId);
			return {
				...prev,
				[teamId]: !currentlyExpanded,
			};
		});
	};

	const playersMap = useMemo(
		() => new Map<string, PlayerState>(game.players.map((p) => [p.id, p])),
		[game.players],
	);

	// Collect unassigned / spectator players
	const assignedPlayerIds = useMemo(
		() => new Set(game.teams.flatMap((t) => t.playerIds ?? [])),
		[game.teams],
	);

	const spectatorPlayers = useMemo(() => {
		if (game.spectators && game.spectators.length > 0) {
			const list = game.spectators
				.map((id) => playersMap.get(id))
				.filter(Boolean) as PlayerState[];
			if (list.length > 0) return list;
		}
		return game.players.filter((p) => !assignedPlayerIds.has(p.id));
	}, [game.spectators, game.players, playersMap, assignedPlayerIds]);

	return (
		<aside className={styles.sidebar}>
			{/* Clean Header: No player or team count badges */}
			<div className={styles.header}>
				<div className={styles.titleWrapper}>
					<Users size={16} color="var(--game-text-secondary, #94a3b8)" />
					<span className={styles.title}>Teams</span>
				</div>
			</div>

			{/* Scrollable Teams List: elements do not compress on expand */}
			<div className={`${styles.teamsList} game-scroll`}>
				{orderedTeams.map((team, index) => {
					const isActiveTurn = team.id === activeTurnTeamId;
					const isNextTurn = team.id === nextTeamId && !isActiveTurn;
					const isLeader = team.score === maxScore && maxScore > 0;
					const isExpanded = expandedTeamIds[team.id] ?? isActiveTurn;

					const teamColor = getDynamicTeamColor(
						team as TeamState & { color?: string },
						index,
					);
					const teamPlayers = (team.playerIds ?? [])
						.map((pId) => playersMap.get(pId))
						.filter(Boolean) as PlayerState[];

					return (
						<div
							key={team.id}
							className={`${styles.teamCard} ${isActiveTurn ? styles.activeTurn : ""}`}
							style={
								{
									"--team-color": teamColor,
									"--team-glow": `${teamColor}40`,
								} as React.CSSProperties
							}
						>
							{/* Clickable Header Accordion Row */}
							<button
								type="button"
								className={styles.teamHeader}
								onClick={() => toggleTeam(team.id)}
							>
								<div className={styles.teamIdentity}>
									<div className={styles.teamColorBar} />
									<span className={styles.teamName}>{team.name}</span>

									{/* Leader Crown Icon */}
									{isLeader && (
										<span title="Leader (highest score)">
											<Crown size={15} className={styles.crownIcon} />
										</span>
									)}

									{/* Next Turn Icon Badge */}
									{isNextTurn && (
										<span
											className={styles.nextTurnBadge}
											title="Next team to play"
										>
											<FastForward size={12} />
											<span>Next</span>
										</span>
									)}
								</div>

								<div className={styles.teamMetrics}>
									<span className={styles.teamScoreBadge}>
										{team.score} pts
									</span>
									<ChevronDown
										size={16}
										className={`${styles.chevron} ${
											isExpanded ? styles.expanded : ""
										}`}
									/>
								</div>
							</button>

							{/* Collapsible Players List */}
							{isExpanded && (
								<div className={styles.playersList}>
									{teamPlayers.map((player) => {
										const isExplaining =
											isActiveTurn && player.id === explainerId;
										const isSpeaking = activeSpeakerIds.includes(player.id);

										return (
											<div
												key={player.id}
												className={`${styles.playerRow} ${
													isSpeaking ? styles.speaking : ""
												}`}
											>
												<div className={styles.playerInfo}>
													<div className={styles.playerAvatarWrapper}>
														<img
															src={`https://api.dicebear.com/7.x/bottts/svg?seed=${player.name}`}
															alt={player.name}
															className={styles.playerAvatar}
														/>
														{isSpeaking && (
															<div className={styles.playerSpeakingRing} />
														)}
													</div>
													<span className={styles.playerName}>
														{player.name}
													</span>
												</div>

												<div className={styles.playerMeta}>
													{/* Live Speech Indicator */}
													{isSpeaking && (
														<div
															className={styles.speechIndicator}
															title="Speaking now"
														>
															<span className={styles.soundWaveBar} />
															<span className={styles.soundWaveBar} />
															<span className={styles.soundWaveBar} />
														</div>
													)}

													{/* Simple Explainer Icon (no guessing badge) */}
													{isExplaining && (
														<span
															className={styles.explainingIcon}
															title="Explaining clues"
														>
															<Mic size={11} />
														</span>
													)}

													<span className={styles.playerScore}>
														+{player.score || 0}
													</span>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</div>
					);
				})}

				{/* Special "Spectators" non-playing team/group at the very bottom */}
				{spectatorPlayers.length > 0 && (
					<div className={`${styles.teamCard} ${styles.spectatorsCard}`}>
						<button
							type="button"
							className={styles.teamHeader}
							onClick={() => toggleTeam("spectators-group")}
						>
							<div className={styles.teamIdentity}>
								<div className={styles.spectatorIconWrapper}>
									<Eye size={14} />
								</div>
								<span className={styles.spectatorTitle}>Spectators</span>
							</div>

							<div className={styles.teamMetrics}>
								<ChevronDown
									size={16}
									className={`${styles.chevron} ${
										(expandedTeamIds["spectators-group"] ?? false)
											? styles.expanded
											: ""
									}`}
								/>
							</div>
						</button>

						{(expandedTeamIds["spectators-group"] ?? false) && (
							<div className={styles.playersList}>
								{spectatorPlayers.map((player) => (
									<div key={player.id} className={styles.playerRow}>
										<div className={styles.playerInfo}>
											<div className={styles.playerAvatarWrapper}>
												<img
													src={`https://api.dicebear.com/7.x/bottts/svg?seed=${player.name}`}
													alt={player.name}
													className={styles.playerAvatar}
												/>
											</div>
											<span className={styles.playerName}>{player.name}</span>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</aside>
	);
}
