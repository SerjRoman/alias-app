import type { Server, Socket } from "socket.io";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import type {
	ChangeWordScoreDto,
	JoinGameDto,
	NextRoundDto,
	NextWordDto,
	StartRoundDto,
	ToggleGameReadyDto,
	UpdateGameSettingsDto,
} from "../dto/body";
import type {
	GameResponseDetailsDto,
	PlayerResponseDto,
	RoundResponseDto,
	TeamResponseDto,
	WordResponseDto,
} from "../dto/response";

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
