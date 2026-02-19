import type { GameState } from "../domain/entities/game.entity";
import type { PlayerState } from "../domain/entities/player.entity";
import type { TeamState } from "../domain/entities/team.entity";

export const GAME_UPDATED = "game.updated";
export type GameUpdatedPayload = { room: GameState };

export const PLAYER_GAME_READY_UPDATE = "game.player.ready.update";
export type PlayerGameReadyPayload = { roomId: string; player: PlayerState };
export const PLAYER_ROUND_READY_UPDATE = "game.round.player.ready.update";
export type PlayerRoundReadyPayload = { roomId: string; player: PlayerState };

export const PLAYER_KICKED = "game.player.kicked";
export type PlayerKickedPayload = { roomId: string; playerId: string };

export const GAME_STARTED = "game.started";
export type GameStartedPayload = { room: GameState };

export const TEAMS_UPDATED = "game.teams.updated";
export type TeamsUpdatedPayload = { roomId: string; teams: TeamState[] };
