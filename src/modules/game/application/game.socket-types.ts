import type { Server, Socket } from "socket.io";
import type { UserFromToken } from "../../../common/types/user-from-token";
import type { ToggleGameReadyDto, UpdateGameSettingsDto } from "./dto/body";
import type { GameState } from "../domain/entities/game.entity";
import type { GameResponseDetailsDto } from "./dto/response";
import type { PlayerState } from "../domain/entities/player.entity";
import type { TeamState } from "../domain/entities/team.entity";

interface ServerToClientEvents {
	gameUpdated: (data: GameResponseDetailsDto) => void;
	gameReadyToggled: (data: GameState) => void;
	playerGameReadyUpdate: (data: PlayerState) => void;
	playerGameRoundUpdate: (data: PlayerState) => void;
	playerKicked: (data: { playerId: string }) => void;
	gameStarted: (data: GameResponseDetailsDto) => void;
	teamUpdated: (data: TeamState[]) => void;
}

interface ClientToServerEvents {
	toggleGameReady: (data: ToggleGameReadyDto) => void;
	updateGameSettings: (data: UpdateGameSettingsDto) => void;
}
export type GameSocket = Socket<
	ClientToServerEvents,
	ServerToClientEvents,
	object,
	{
		user: UserFromToken;
	}
>;
export type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;
