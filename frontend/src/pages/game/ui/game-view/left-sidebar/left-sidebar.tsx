import { useState, useMemo, useRef, useLayoutEffect, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import { useAuth } from "@shared/api";
import {
	useGameSlice,
	useGameVoice,
	usePrivatePlayerSlice,
	usePlayersDisplayMap,
	RoundStatus,
	type TeamState,
	type PlayerState,
} from "@entities/game";
import { useActiveGameActions } from "../../../api/use-active-game-actions";
import { getDynamicTeamColor } from "../../../api/game-stubs";
import { TeamCard } from "./team-card";
import { SpectatorsCard } from "./spectators-card";
import styles from "./left-sidebar.module.css";

const EMPTY_TEAMS: TeamState[] = [];
const EMPTY_PLAYERS: PlayerState[] = [];

export function LeftSidebar() {
	const { t } = useTranslation();
	const activeSpeakerIds = useGameVoice((state) => state.activeSpeakerIds);
	const roomId = useGameSlice((state) => state.game?.id ?? "");
	const teams = useGameSlice((state) => state.game?.teams ?? EMPTY_TEAMS);
	const players = useGameSlice(
		(state) => state.game?.players ?? EMPTY_PLAYERS,
	);
	const spectators = useGameSlice((state) => state.game?.spectators);
	const currentRound = useGameSlice((state) => state.game?.currentRound);
	const { user } = useAuth();
	const { activateItem } = useActiveGameActions();
	const pendingTargetItem = usePrivatePlayerSlice(
		(state) => state.pendingTargetItem,
	);
	const setPendingTargetItem = usePrivatePlayerSlice(
		(state) => state.setPendingTargetItem,
	);

	const myTeamId = useMemo(
		() =>
			teams.find((t) => Boolean(user && t.playerIds.includes(user.id)))
				?.id,
		[teams, user],
	);

	const activeTurnTeamId = currentRound?.teamId ?? teams[0]?.id;
	const explainerId = currentRound?.explainerId;
	const isRoundPending = currentRound?.status === RoundStatus.PENDING;

	const maxScore = useMemo(
		() => (teams.length > 0 ? Math.max(...teams.map((t) => t.score)) : 0),
		[teams],
	);

	const nextTeamId = useMemo(() => {
		const activeIndex = teams.findIndex((t) => t.id === activeTurnTeamId);
		if (activeIndex < 0 || teams.length <= 1) return null;
		const nextIndex = (activeIndex + 1) % teams.length;
		return teams[nextIndex]?.id ?? null;
	}, [teams, activeTurnTeamId]);

	const orderedTeams = useMemo(() => {
		const active = teams.find((t) => t.id === activeTurnTeamId);
		const others = teams.filter((t) => t.id !== activeTurnTeamId);
		return active ? [active, ...others] : teams;
	}, [teams, activeTurnTeamId]);

	const [expandedTeamIds, setExpandedTeamIds] = useState<
		Record<string, boolean>
	>(() => (activeTurnTeamId ? { [activeTurnTeamId]: true } : {}));

	const [justActivatedTeamId, setJustActivatedTeamId] = useState<
		string | null
	>(null);
	const teamsListRef = useRef<HTMLDivElement | null>(null);
	const teamSlotRefs = useRef<Map<string, HTMLDivElement>>(new Map());
	const prevTopsRef = useRef<Map<string, number>>(new Map());
	const prevActiveTeamIdRef = useRef<string | undefined>(activeTurnTeamId);

	useEffect(() => {
		const prevId = prevActiveTeamIdRef.current;
		prevActiveTeamIdRef.current = activeTurnTeamId;

		if (!prevId || !activeTurnTeamId || prevId === activeTurnTeamId) {
			return;
		}

		setJustActivatedTeamId(activeTurnTeamId);
		teamsListRef.current?.scrollTo({ top: 0, behavior: "smooth" });

		const timer = setTimeout(() => {
			setJustActivatedTeamId((curr) =>
				curr === activeTurnTeamId ? null : curr,
			);
		}, 1200);

		return () => clearTimeout(timer);
	}, [activeTurnTeamId]);

	useLayoutEffect(() => {
		const newTops = new Map<string, number>();
		const animatedEls: HTMLDivElement[] = [];

		for (const team of orderedTeams) {
			const el = teamSlotRefs.current.get(team.id);
			if (!el) continue;

			const rect = el.getBoundingClientRect();
			newTops.set(team.id, rect.top);

			const prevTop = prevTopsRef.current.get(team.id);
			if (prevTop !== undefined) {
				const deltaY = prevTop - rect.top;
				if (Math.abs(deltaY) > 1) {
					el.style.transition = "none";
					el.style.transform = `translateY(${deltaY}px)`;
					el.style.zIndex =
						team.id === activeTurnTeamId ? "2" : "1";
					animatedEls.push(el);
				}
			}
		}

		prevTopsRef.current = newTops;

		if (animatedEls.length === 0) return;

		// Force reflow before playing FLIP transform
		void teamsListRef.current?.offsetHeight;

		let cleanupTimer: ReturnType<typeof setTimeout> | undefined;
		const rafId = requestAnimationFrame(() => {
			for (const el of animatedEls) {
				el.style.transition =
					"transform 420ms cubic-bezier(0.22, 1, 0.36, 1)";
				el.style.transform = "translateY(0)";
			}
			cleanupTimer = setTimeout(() => {
				for (const el of animatedEls) {
					el.style.transition = "";
					el.style.transform = "";
					el.style.zIndex = "";
				}
			}, 440);
		});

		return () => {
			cancelAnimationFrame(rafId);
			if (cleanupTimer) clearTimeout(cleanupTimer);
		};
	}, [orderedTeams, activeTurnTeamId]);

	const toggleTeam = (teamId: string) => {
		setExpandedTeamIds((prev) => {
			const currentlyExpanded =
				prev[teamId] ?? teamId === activeTurnTeamId;
			return {
				...prev,
				[teamId]: !currentlyExpanded,
			};
		});
	};

	const playersMap = useMemo(
		() => new Map<string, PlayerState>(players.map((p) => [p.id, p])),
		[players],
	);
	const playersDisplayMap = usePlayersDisplayMap(players);

	const assignedPlayerIds = useMemo(
		() => new Set(teams.flatMap((t) => t.playerIds ?? [])),
		[teams],
	);

	const spectatorPlayers = useMemo(() => {
		if (spectators && spectators.length > 0) {
			const list = spectators
				.map((id) => playersMap.get(id))
				.filter(Boolean) as PlayerState[];
			if (list.length > 0) return list;
		}
		return players.filter((p) => !assignedPlayerIds.has(p.id));
	}, [spectators, players, playersMap, assignedPlayerIds]);

	return (
		<aside className={styles.sidebar}>
			<div className={styles.header}>
				<div className={styles.titleWrapper}>
					<Users
						size={16}
						color="var(--game-text-secondary, #94a3b8)"
					/>
					<span className={styles.title}>{t("gameView.teams")}</span>
				</div>
			</div>

			<div ref={teamsListRef} className={`${styles.teamsList} game-scroll`}>
				{orderedTeams.map((team) => {
					const isActiveTurn = team.id === activeTurnTeamId;
					const isNextTurn = team.id === nextTeamId && !isActiveTurn;
					const isLeader = team.score === maxScore && maxScore > 0;
					const isExpanded = expandedTeamIds[team.id] ?? isActiveTurn;
					const originalIndex = teams.findIndex(
						(t) => t.id === team.id,
					);

					const teamColor = getDynamicTeamColor(
						team as TeamState & { color?: string },
						originalIndex >= 0 ? originalIndex : 0,
					);
					const teamPlayers = (team.playerIds ?? [])
						.map((pId) => playersMap.get(pId))
						.filter(Boolean) as PlayerState[];

					const isExplainerOnlyEffect =
						pendingTargetItem?.itemId === "FLIP_WORD" ||
						pendingTargetItem?.itemId === "FREEZE_NEXT_WORD";
					const isTargetableTeam =
						pendingTargetItem?.target === "enemy_team" &&
						team.id !== myTeamId;
					const isTargetablePlayers =
						pendingTargetItem?.target === "enemy_player" &&
						team.id !== myTeamId &&
						(!isExplainerOnlyEffect ||
							(isActiveTurn && !isRoundPending));

					return (
						<div
							key={team.id}
							ref={(el) => {
								if (el) {
									teamSlotRefs.current.set(team.id, el);
								} else {
									teamSlotRefs.current.delete(team.id);
								}
							}}
							className={styles.teamSlot}
						>
							<TeamCard
								team={team}
								teamColor={teamColor}
								isActiveTurn={isActiveTurn}
								isNextTurn={isNextTurn}
								isTurnTransitioning={
									team.id === justActivatedTeamId
								}
								isLeader={isLeader}
								isExpanded={isExpanded}
								isRoundPending={isRoundPending}
								isTargetableTeam={isTargetableTeam}
								isTargetablePlayers={isTargetablePlayers}
								players={teamPlayers}
								playersDisplayMap={playersDisplayMap}
								explainerId={explainerId}
								activeSpeakerIds={activeSpeakerIds}
								onToggle={() => toggleTeam(team.id)}
								onSelectTeam={() => {
									if (roomId && pendingTargetItem) {
										activateItem(
											roomId,
											pendingTargetItem.inventoryItemId,
											team.id,
										);
										setPendingTargetItem(null);
									}
								}}
								onSelectPlayer={(playerId) => {
									if (roomId && pendingTargetItem) {
										activateItem(
											roomId,
											pendingTargetItem.inventoryItemId,
											undefined,
											playerId,
										);
										setPendingTargetItem(null);
									}
								}}
							/>
						</div>
					);
				})}

				{spectatorPlayers.length > 0 && (
					<SpectatorsCard
						spectators={spectatorPlayers}
						playersDisplayMap={playersDisplayMap}
						isExpanded={
							expandedTeamIds["spectators-group"] ?? false
						}
						activeSpeakerIds={activeSpeakerIds}
						onToggle={() => toggleTeam("spectators-group")}
					/>
				)}
			</div>
		</aside>
	);
}
