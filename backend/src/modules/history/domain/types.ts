import { type GameSettings } from "../../game/domain/entities/game.entity";
import { PlayerState } from "../../game/domain/entities/player.entity";
import { WordState } from "../../game/domain/entities/round.entity";
import { TeamState } from "../../game/domain/entities/team.entity";

export interface HistoryRoundParticipantState {
	id: string;
	roundId: string;
	playerId: string | null;
	teamId: string;
	scoreAfterRound: number;
}

export interface HistoryTeamState {
	id: string;
	name: string;
}

export interface HistoryParticipantState {
	id: string;
	userId: string | null;
	name: string;
	teamId: string;
	finalScore: number;
}

export interface HistoryRoundState {
	id: string;
	gameId: string;
	teamId: string;
	guesserId: string;
	words: WordState[];
	roundNumber: number;
	participants: HistoryRoundParticipantState[];
}

export interface HistoryGameState {
	id: string;
	ownerId: string | null;
	status: string;
	winnerTeamId: string | null;
	settings: GameSettings;
	teamsFinalState: TeamState[];
	playersFinalState: PlayerState[];
	createdAt: Date;
	updatedAt: Date;
	rounds: HistoryRoundState[];
	participants: HistoryParticipantState[];
	teams: HistoryTeamState[];
}
