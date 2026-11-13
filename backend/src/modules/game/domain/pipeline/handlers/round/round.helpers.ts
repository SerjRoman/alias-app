import type { ActionContext } from "../../pipeline.types";
import { type WordOutcome } from "../../../state/game.state";
import { TeamHasNoOnlinePlayersError } from "../../../errors/team.errors";

export const OUTCOME_LADDER: readonly WordOutcome[] = Object.freeze([
	"skipped",
	"neutral",
	"guessed",
]);

export function inferOutcomeFromWord(word: {
	outcome?: WordOutcome;
	score: number;
}): WordOutcome {
	if (word.outcome) {
		return word.outcome;
	}
	if (word.score > 0) return "guessed";
	if (word.score < 0) return "skipped";
	return "neutral";
}

export function assertAtLeastTwoTeamsHaveOnlinePlayers(
	state: ActionContext["state"],
	targetTeamId?: string,
) {
	const teamsWithOnlinePlayers = state.teams.filter((team) => {
		const onlinePlayers = state.players.filter(
			(p) =>
				(p.teamId === team.id ||
					Boolean(team.playerIds?.includes(p.id))) &&
				p.isOnline !== false,
		);
		return onlinePlayers.length > 0;
	});

	if (teamsWithOnlinePlayers.length < 2) {
		const emptyTeam = state.teams.find(
			(t) => !teamsWithOnlinePlayers.some((active) => active.id === t.id),
		);
		throw new TeamHasNoOnlinePlayersError(
			emptyTeam ? emptyTeam.id : "",
			emptyTeam?.name,
		);
	}

	if (
		targetTeamId &&
		!teamsWithOnlinePlayers.some((t) => t.id === targetTeamId)
	) {
		const targetTeam = state.teams.find((t) => t.id === targetTeamId);
		throw new TeamHasNoOnlinePlayersError(targetTeamId, targetTeam?.name);
	}

	return teamsWithOnlinePlayers;
}
