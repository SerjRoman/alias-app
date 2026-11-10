import type { Server, Socket } from "socket.io";
import type {
	ToggleGameReadyDto,
	UpdateGameSettingsDto,
	JoinGameDto,
	NextRoundDto,
	NextWordDto,
	StartRoundDto,
	ChangeWordScoreDto,
	SubmitCustomWordsDto,
	CreateTeamDto,
	MoveToTeamDto,
	MoveToSpectatorsDto,
	DeleteTeamDto,
	PlayerLeaveRoomBodyDto,
	EndPointingDto,
	DeleteGameDto,
	FinishRoundDto,
	KickPlayerDto,
	BanPlayerDto,
	EndGameDto,
	SetExplainerDto,
	ShufflePlayersDto,
	ChangeRoundTimeDto,
	StartPointingDto,
} from "../application/dto/body";
import type {
	GameResponseDetailsDto,
	GameUpdateResponseDto,
	TeamResponseDto,
	PlayerResponseDto,
	RoundResponseDto,
	WordResponseDto,
	GameSettingsDto,
} from "../application/dto/response";
import type { AuthenticatedUser } from "@common/types/authenticated-user";
import type { ADMIN_EVENTS } from "./socket.events";

interface ServerToClientEvents {
	gameUpdated: (data: GameUpdateResponseDto | GameResponseDetailsDto) => void;
	"game-settings-updated": (data: GameSettingsDto) => void;
	teamsUpdated: (data: TeamResponseDto[]) => void;
	playersUpdated: (data: PlayerResponseDto[]) => void;
	playerKicked: (data: { kickedUserId: string }) => void;
	gameStarted: (data: GameResponseDetailsDto) => void;
	roundUpdated: (data: RoundResponseDto) => void;
	privateWord: (dto: WordResponseDto) => void;
	gameFinished: () => void;
}

interface ClientToServerEvents {
	toggleGameReady: (data: ToggleGameReadyDto) => void;
	toggleRoundReady: (data: { roomId: string }) => void;
	joinGame: (dto: JoinGameDto) => Promise<GameResponseDetailsDto>;
	startGame: (dto: { roomId: string }) => void;
	submitCustomWords: (
		dto: SubmitCustomWordsDto,
	) => Promise<GameResponseDetailsDto>;
	updateGameSettings: (dto: UpdateGameSettingsDto) => void;
	createTeam: (dto: CreateTeamDto) => void;
	moveToTeam: (dto: MoveToTeamDto) => void;
	moveToSpectators: (dto: MoveToSpectatorsDto) => void;
	deleteTeam: (dto: DeleteTeamDto) => void;
	leaveGame: (body: PlayerLeaveRoomBodyDto) => Promise<{ success: boolean }>;
	nextWord: (dto: NextWordDto) => Promise<WordResponseDto>;
	nextRound: (dto: NextRoundDto) => void;
	endPointing: (dto: EndPointingDto) => void;
	startRound: (dto: StartRoundDto) => void;
	changeWordScore: (dto: ChangeWordScoreDto) => void;
	deleteGame: (dto: DeleteGameDto) => void;
	finishRound: (dto: FinishRoundDto) => void;
	[ADMIN_EVENTS.assignPlayerToTeam]: (dto: MoveToTeamDto) => void;
	[ADMIN_EVENTS.kickPlayer]: (dto: KickPlayerDto) => void;
	[ADMIN_EVENTS.banPlayer]: (dto: BanPlayerDto) => void;
	[ADMIN_EVENTS.endGame]: (dto: EndGameDto) => void;
	[ADMIN_EVENTS.setExplainer]: (dto: SetExplainerDto) => void;
	[ADMIN_EVENTS.shufflePlayers]: (dto: ShufflePlayersDto) => void;
	[ADMIN_EVENTS.changeRoundTime]: (dto: ChangeRoundTimeDto) => void;
	[ADMIN_EVENTS.startPointing]: (dto: StartPointingDto) => void;
	[ADMIN_EVENTS.startRound]: (dto: StartRoundDto) => void;
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
