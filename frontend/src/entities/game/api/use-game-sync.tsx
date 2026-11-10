import { useEffect } from "react";
import { useGameSlice } from "../model/game.slice";
import { socketClient, setWsErrorResolver } from "@shared/api";
import { i18n } from "@shared/config";

export function useGameSync() {
	const updatePlayers = useGameSlice((state) => state.updatePlayers);
	const updateTeams = useGameSlice((state) => state.updateTeams);
	const updateGameSettings = useGameSlice((state) => state.updateGameSettings);
	const setGameState = useGameSlice((state) => state.setGameState);
	const updateRound = useGameSlice((state) => state.updateRound);

	useEffect(() => {
		setWsErrorResolver((payload) => {
			const game = useGameSlice.getState().game;
			const details: Record<string, unknown> = { ...(payload.details || {}) };

			// Enrich teamId and teamName
			let teamId = (details.teamId as string) || payload.teamId;
			if (!teamId && payload.message) {
				const uuidMatch = payload.message.match(
					/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
				);
				if (uuidMatch) {
					teamId = uuidMatch[0];
				}
			}

			if (teamId) {
				details.teamId = teamId;
				if (!details.teamName && game?.teams) {
					const team = game.teams.find((t) => t.id === teamId);
					if (team?.name) {
						details.teamName = team.name;
					}
				}
			} else if (payload.teamName && !details.teamName) {
				details.teamName = payload.teamName;
			}

			// Enrich playerId and playerName
			const playerId = (details.playerId as string) || payload.playerId;
			if (playerId) {
				details.playerId = playerId;
				if (!details.playerName && game?.players) {
					const player = game.players.find((p) => p.id === playerId);
					if (player?.name) {
						details.playerName = player.name;
					}
				}
			} else if (payload.playerName && !details.playerName) {
				details.playerName = payload.playerName;
			}

			// If error code is present, check i18n
			if (payload.code) {
				const i18nKey = `gameErrors.${payload.code}`;
				if (i18n.exists(i18nKey as unknown as string)) {
					const translate = i18n.t as unknown as (
						key: string,
						options?: Record<string, unknown>,
					) => string;
					return translate(i18nKey, details);
				}
			}

			// Fallback checks for legacy / name-based matching
			if (
				payload.name === "TeamHasNoOnlinePlayersError" ||
				payload.message?.includes("has no online players")
			) {
				const teamNameOrId = (details.teamName as string) || teamId || "";
				return i18n.t("gameErrors.TEAM_HAS_NO_ONLINE_PLAYERS", {
					teamName: teamNameOrId,
					defaultValue: `У команды "${teamNameOrId}" нет игроков онлайн`,
				});
			}

			if (
				payload.name === "TeamIsPlayingError" ||
				payload.message?.includes("currently playing")
			) {
				const teamNameOrId = (details.teamName as string) || teamId || "";
				return i18n.t("gameErrors.TEAM_IS_PLAYING", {
					teamName: teamNameOrId,
					defaultValue: `Нельзя удалить команду "${teamNameOrId}": она сейчас играет в активном раунде`,
				});
			}

			return null;
		});

		socketClient.on("playersUpdated", updatePlayers);
		socketClient.on("teamsUpdated", updateTeams);
		socketClient.on("game-settings-updated", updateGameSettings);
		socketClient.on("gameUpdated", setGameState);
		socketClient.on("roundUpdated", updateRound);
		socketClient.on("gameStarted", setGameState);

		return () => {
			setWsErrorResolver(null);
			socketClient.off("playersUpdated", updatePlayers);
			socketClient.off("teamsUpdated", updateTeams);
			socketClient.off("game-settings-updated", updateGameSettings);
			socketClient.off("gameUpdated", setGameState);
			socketClient.off("gameStarted", setGameState);
			socketClient.off("roundUpdated", updateRound);
		};
	}, [updatePlayers, updateTeams, updateGameSettings, setGameState, updateRound]);
}
