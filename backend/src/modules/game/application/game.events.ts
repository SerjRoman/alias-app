import type { GameState, RoundState, PlayerState, TeamState } from "../domain";

export const GAME_UPDATED = "game.updated";
export type GameUpdatedPayload = { room: GameState };

export const GAME_SETTINGS_UPDATED = "game.settings.updated";
export type GameSettingsUpdatedPayload = {
	roomId: string;
	settings: GameState["settings"];
};

export const GAME_FINISHED = "game.finished";
export type GameFinishedPayload = { room: GameState };

export const PLAYERS_UPDATED = "game.player.updated";
export type PlayersUpdatedPayload = {
	roomId: string;
	players: PlayerState[];
};

export const PLAYER_KICKED = "game.player.kicked";
export type PlayerKickedPayload = {
	roomId: string;
	kickedUserId: string;
};

export const GAME_STARTED = "game.started";
export type GameStartedPayload = { room: GameState };

export const TEAMS_UPDATED = "game.teams.updated";
export type TeamsUpdatedPayload = {
	roomId: string;
	teams: TeamState[];
};

export const ROUND_UPDATED = "game.round.updated";
export type RoundUpdatedPayload = {
	roomId: string;
	round: RoundState;
};

export const ROUND_FINISHED = "game.round.finished";
export type RoundFinishedPayload = { room: GameState };
