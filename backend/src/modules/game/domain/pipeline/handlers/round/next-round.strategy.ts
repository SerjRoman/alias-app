import { v4 as uuidv4 } from "uuid";
import type { ActionStrategy } from "../../../dispatcher/action-dispatcher";
import type { NextRoundAction } from "../../../actions/game.actions";
import type { ActionContext } from "../../pipeline.types";
import {
	RoundStatus,
	type RoundState,
	type TeamState,
} from "../../../state/game.state";
import { RoundCreatedDomainEvent } from "../../../events/game.events";
import { PlayerNotRoomOwnerError } from "../../../errors/game.errors";
import { RoundIsNotFinished } from "../../../errors/round.errors";
import { assertAtLeastTwoTeamsHaveOnlinePlayers } from "./round.helpers";

export class NextRoundStrategy implements ActionStrategy<NextRoundAction> {
	readonly actionType = "NEXT_ROUND" as const;

	handle(action: NextRoundAction, ctx: ActionContext): void {
		const { state, emit } = ctx;
		const round = state.currentRound;

		if (round?.status !== RoundStatus.FINISHED) {
			throw new RoundIsNotFinished(
				"Previous round must be FINISHED before starting a new round",
			);
		}
		if (
			(state.settings?.isOnlyOwnerCanNextRound ?? true) &&
			action.actorId &&
			action.actorId !== state.ownerId
		) {
			throw new PlayerNotRoomOwnerError();
		}

		const teamsWithOnlinePlayers =
			assertAtLeastTwoTeamsHaveOnlinePlayers(state);

		const { nextTeam, nextTeamIndex } = this.resolveNextTeam(
			state,
			teamsWithOnlinePlayers,
			action.payload?.nextTeamId,
			round.teamId,
		);

		state.activeTeamId = nextTeam.id;
		state.lastTeamPlayedIndex = nextTeamIndex;

		const teamPlayers = state.players.filter(
			(p) =>
				p.teamId === nextTeam.id ||
				Boolean(nextTeam.playerIds?.includes(p.id)),
		);

		const nextExplainerId = this.resolveNextExplainer(
			nextTeam,
			teamPlayers,
			action.payload?.nextExplainerId,
		);

		const newRound: RoundState = {
			id: uuidv4(),
			explainerId: nextExplainerId,
			teamId: nextTeam.id,
			status: RoundStatus.PENDING,
			currentWord: null,
			words: [],
			roundNumber: round.roundNumber + 1,
			expiresAt: 0,
		};

		state.currentRound = newRound;

		emit(new RoundCreatedDomainEvent(state.id, newRound));
	}

	private resolveNextTeam(
		state: ActionContext["state"],
		teamsWithOnlinePlayers: TeamState[],
		requestedTeamId: string | undefined,
		currentRoundTeamId: string,
	): { nextTeam: TeamState; nextTeamIndex: number } {
		if (requestedTeamId) {
			const requestedTeam = state.teams.find(
				(t) => t.id === requestedTeamId,
			);
			if (
				requestedTeam &&
				teamsWithOnlinePlayers.some((t) => t.id === requestedTeam.id)
			) {
				const index = state.teams.findIndex(
					(t) => t.id === requestedTeam.id,
				);
				return { nextTeam: requestedTeam, nextTeamIndex: index };
			}
		}

		const currentTeamIndex = state.teams.findIndex(
			(t) => t.id === (state.activeTeamId ?? currentRoundTeamId),
		);
		const totalTeams = state.teams.length;
		for (let i = 1; i <= totalTeams; i++) {
			const candidateIndex =
				currentTeamIndex >= 0
					? (currentTeamIndex + i) % totalTeams
					: (i - 1) % totalTeams;
			const candidateTeam = state.teams[candidateIndex];
			if (
				teamsWithOnlinePlayers.some(
					(active) => active.id === candidateTeam.id,
				)
			) {
				return {
					nextTeam: candidateTeam,
					nextTeamIndex: candidateIndex,
				};
			}
		}

		const fallback = teamsWithOnlinePlayers[0];
		return {
			nextTeam: fallback,
			nextTeamIndex: state.teams.findIndex((t) => t.id === fallback.id),
		};
	}

	private resolveNextExplainer(
		nextTeam: TeamState,
		teamPlayers: ActionContext["state"]["players"],
		requestedExplainerId: string | undefined,
	): string {
		if (requestedExplainerId) {
			nextTeam.lastExplainerId = requestedExplainerId;
			return requestedExplainerId;
		}

		const prevIndex = nextTeam.lastExplainerId
			? teamPlayers.findIndex((p) => p.id === nextTeam.lastExplainerId)
			: -1;
		const startIdx =
			prevIndex >= 0 ? (prevIndex + 1) % teamPlayers.length : 0;

		let chosenId = "";
		for (let i = 0; i < teamPlayers.length; i++) {
			const candidate = teamPlayers[(startIdx + i) % teamPlayers.length];
			if (candidate.isOnline !== false) {
				chosenId = candidate.id;
				break;
			}
		}
		nextTeam.lastExplainerId = chosenId || null;
		return chosenId;
	}
}
