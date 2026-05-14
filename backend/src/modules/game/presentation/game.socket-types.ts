import type { Server, Socket } from "socket.io";
import {
	ToggleGameReadyDto,
	UpdateGameSettingsDto,
	JoinGameDto,
	NextRoundDto,
	NextWordDto,
	StartRoundDto,
	ChangeWordScoreDto,
} from "../application/dto/body";
import {
	GameResponseDetailsDto,
	TeamResponseDto,
	PlayerResponseDto,
	RoundResponseDto,
	WordResponseDto,
} from "../application/dto/response";
import { AuthenticatedUser } from "@common/types/authenticated-user";

interface ServerToClientEvents {
	gameUpdated: (data: GameResponseDetailsDto) => void;
	teamsUpdated: (data: TeamResponseDto[]) => void;
	playersUpdated: (data: PlayerResponseDto[]) => void;
	gameReadyToggled: (data: GameResponseDetailsDto) => void;
	playerKicked: (data: { kickedUserId: string }) => void;
	gameStarted: (data: GameResponseDetailsDto) => void;
	roundUpdated: (data: RoundResponseDto) => void;
	roundFinished: (data: GameResponseDetailsDto) => void;
	privateWord: (dto: WordResponseDto) => void;
	gameFinished: () => void;
}

interface ClientToServerEvents {
	toggleGameReady: (data: ToggleGameReadyDto) => void;
	updateGameSettings: (data: UpdateGameSettingsDto) => void;
	joinGame: (dto: JoinGameDto) => Promise<GameResponseDetailsDto>;
	nextRound: (dto: NextRoundDto) => void;
	nextWord: (dto: NextWordDto) => Promise<RoundResponseDto>;
	startRound: (dto: StartRoundDto) => void;
	changeWordScore: (dto: ChangeWordScoreDto) => void;
}
export type GameSocket = Socket<
	ClientToServerEvents,
	ServerToClientEvents,
	object,
	{
		user: AuthenticatedUser;
	}
>;
export type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;
