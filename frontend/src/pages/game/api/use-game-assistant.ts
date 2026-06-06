import { useTranslation } from "react-i18next";
import { type GameStateDetails, GameStatus, RoundStatus } from "@entities/game";
import { type AssistantMessage } from "@shared/ui";

export function useGameAssistant(
	game: GameStateDetails | null,
	userId: string,
): AssistantMessage | null {
	const { t } = useTranslation();

	if (!game) return null;

	const isOwner = game.ownerId === userId;
	const currentRound = game.currentRound;

	let tipKey = "";
	let variant: "info" | "success" | "warning" = "info";
	let priority: "high" | "normal" = "normal";

	if (game.status === GameStatus.LOBBY) {
		const allAssignedIds = new Set(
			game.teams.flatMap((team) => team.playerIds),
		);
		if (game.teams.length === 0 || !allAssignedIds.has(userId)) {
			tipKey = "gameMaster.lobby.noTeams";
		} else if (isOwner) {
			tipKey = "gameMaster.lobby.admin";
		} else {
			tipKey = "gameMaster.lobby.player";
		}
	} else if (game.status === GameStatus.IN_PROGRESS && currentRound) {
		const isGuesser = currentRound.guesserId === userId;
		const isMyTeamPlaying = game.teams.find(
			(team) =>
				team.id === currentRound.teamId &&
				team.playerIds.includes(userId),
		);

		if (currentRound.status === RoundStatus.PENDING) {
			if (isMyTeamPlaying) {
				tipKey = isGuesser
					? "gameMaster.pending.myTurnExplainer"
					: "gameMaster.pending.myTurnGuesser";
				priority = "high"; // Force open to notify player it is their turn!
				variant = "warning";
			} else {
				tipKey = "gameMaster.pending.otherTurn";
			}
		} else if (currentRound.status === RoundStatus.IN_PROGRESS) {
			if (isMyTeamPlaying) {
				tipKey = isGuesser
					? "gameMaster.inProgress.myTurnExplainer"
					: "gameMaster.inProgress.myTurnGuesser";
				variant = "warning";
			} else {
				tipKey = "gameMaster.inProgress.otherTurn";
			}
		} else if (currentRound.status === RoundStatus.POINTING) {
			tipKey = isOwner
				? "gameMaster.pointing.admin"
				: "gameMaster.pointing.player";
			if (isOwner) {
				priority = "high"; // Force open for admin to review words
			}
		} else if (currentRound.status === RoundStatus.FINISHED) {
			tipKey = isOwner
				? "gameMaster.finished.admin"
				: "gameMaster.finished.player";
		}
	} else if (game.status === GameStatus.FINISHED) {
		tipKey = "gameMaster.gameFinished";
		variant = "success";
		priority = "high"; // Force open to congratulate!
	}

	if (!tipKey) return null;

	return {
		text: t(tipKey as any),
		variant,
		priority,
	};
}
