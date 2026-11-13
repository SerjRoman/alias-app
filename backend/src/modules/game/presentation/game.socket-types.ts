import type { Server, Socket } from "socket.io";
import type {
	ToggleGameReadyDto,
	UpdateGameSettingsDto,
	JoinGameDto,
	NextRoundDto,
	NextWordDto,
	StartRoundDto,
	ChangeWordOutcomeDto,
	SubmitCustomWordsDto,
	CreateTeamDto,
	MoveToTeamDto,
	MoveToSpectatorsDto,
	DeleteTeamDto,
	PlayerLeaveRoomBodyDto,
	EndPointingDto,
	DeleteGameDto,
	KickPlayerDto,
	BanPlayerDto,
	EndGameDto,
	SetExplainerDto,
	ShufflePlayersDto,
	ChangeRoundTimeDto,
	StartPointingDto,
	BuyItemDto,
	UseItemDto,
	GetExplainerWordDto,
	GetShopCatalogDto,
} from "../application/dto/body";
import type {
	GameResponseDetailsDto,
	GameUpdateResponseDto,
	TeamResponseDto,
	PlayerResponseDto,
	RoundResponseDto,
	WordResponseDto,
	GameSettingsDto,
	PrivatePlayerStateResponseDto,
	ExplainerWordResponseDto,
	ShopCatalogResponseDto,
} from "../application/dto/response";
import type { AuthenticatedUser } from "@common/types/authenticated-user";
import type { ADMIN_EVENTS } from "./socket.events";

interface ServerToClientEvents {
	gameUpdated: (data: GameUpdateResponseDto | GameResponseDetailsDto) => void;
	gameSettingsUpdated: (data: GameSettingsDto) => void;
	teamsUpdated: (data: TeamResponseDto[]) => void;
	playersUpdated: (data: PlayerResponseDto[]) => void;
	playerKicked: (data: { kickedUserId: string }) => void;
	gameStarted: (data: GameResponseDetailsDto) => void;
	roundUpdated: (data: RoundResponseDto) => void;
	explainerWord: (dto: ExplainerWordResponseDto) => void;
	privateStateUpdated: (dto: PrivatePlayerStateResponseDto) => void;
	gameFinished: () => void;
	gameDeleted: (data: { roomId: string }) => void;
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
	changeWordOutcome: (dto: ChangeWordOutcomeDto) => void;
	deleteGame: (dto: DeleteGameDto) => void;
	buyItem: (dto: BuyItemDto) => Promise<PrivatePlayerStateResponseDto>;
	useItem: (dto: UseItemDto) => Promise<PrivatePlayerStateResponseDto>;
	getPrivateState: (data: {
		roomId: string;
	}) => Promise<PrivatePlayerStateResponseDto>;
	getExplainerWord?: (
		dto: GetExplainerWordDto,
	) => Promise<ExplainerWordResponseDto | null>;
	getShopCatalog?: (
		dto: GetShopCatalogDto,
	) => Promise<ShopCatalogResponseDto>;
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
