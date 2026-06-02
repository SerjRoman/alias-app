import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	UseGuards,
	Logger,
	UseFilters,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { GameFacade } from "../application/facades/game.facade";
import { PlayerFacade } from "../application/facades/player.facade";
import { GetAuthenticatedUser } from "../../../common/decorators/get-authenticated-user";
import { plainToInstance } from "class-transformer";
import { UserDto } from "@common/dto/user.dto";
import { JwtAuthGuard } from "@common/guards/auth.guard";
import {
	CreateGameDto,
	JoinGameDto,
	GetRoomCodeDto,
	ValidateCodeDto,
} from "../application/dto/body";
import {
	GameResponseDto,
	CreateGameResponseDto,
	GetRoomCodeResponseDto,
	CurrentGameResponseDto,
	ValidateCodeResponseDto,
	GetVoiceTokenResponseDto,
} from "../application/dto/response";
import { GameHttpExceptionFilter } from "./filters/game-exception.filter";
import { VoiceService } from "../application/voice.service";

@ApiTags("Games")
@Controller("games")
@UseFilters(GameHttpExceptionFilter)
export class GameController {
	private readonly logger = new Logger(GameController.name);

	constructor(
		private readonly gameFacade: GameFacade,
		private readonly playerFacade: PlayerFacade,
		private readonly voiceService: VoiceService,
	) {}

	@Get()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: "Get all game rooms" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Returns all game rooms.",
		type: [GameResponseDto],
	})
	async getAll() {
		this.logger.log("Received getAll request");
		const rooms = await this.gameFacade.findAll();
		return plainToInstance(
			GameResponseDto,
			rooms.map((r) => ({ ...r, playersCount: r.players.length })),
			{
				excludeExtraneousValues: true,
			},
		);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.CREATED)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Create a new game room" })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: "The game room has been successfully created.",
		type: CreateGameResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.UNAUTHORIZED,
		description:
			"Unauthorized. The user must be authenticated to create a game room.",
	})
	async create(
		@Body() body: CreateGameDto,
		@GetAuthenticatedUser() user: UserDto,
	) {
		this.logger.log(
			`Received create request with body=${JSON.stringify(body)} userId=${user.id}`,
		);
		const { room, code } = await this.gameFacade.create(body, user);
		return plainToInstance(
			CreateGameResponseDto,
			{ ...room, code },
			{
				excludeExtraneousValues: true,
			},
		);
	}
	@Delete(":id")
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Delete a game room" })
	@ApiParam({
		name: "id",
		description: "The unique identifier of the game room to delete.",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	@ApiResponse({
		status: HttpStatus.NO_CONTENT,
		description: "The game room has been successfully deleted.",
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "The game room with the specified ID was not found.",
	})
	@ApiResponse({
		status: HttpStatus.FORBIDDEN,
		description: "Forbidden. The user is not the owner of the game room.",
	})
	delete(
		@Param() { id }: { id: string },
		@GetAuthenticatedUser() user: UserDto,
	) {
		this.logger.log(
			`Received delete request with id=${id} userId=${user.id}`,
		);
		return this.gameFacade.delete(id, user);
	}

	@Post("join")
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Join a game room" })
	@ApiBody({
		type: JoinGameDto,
		description: "The unique identifier of the game room to join.",
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Successfully joined the game room.",
		type: GameResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "The game room with the specified ID was not found.",
	})
	@ApiResponse({
		status: HttpStatus.FORBIDDEN,
		description: "Forbidden. The user is already in the game room.",
	})
	join(@Body() dto: JoinGameDto, @GetAuthenticatedUser() user: UserDto) {
		this.logger.log(
			`Received join request with body=${JSON.stringify(dto)} userId=${user.id}`,
		);
		return plainToInstance(
			GameResponseDto,
			this.gameFacade.joinGame(dto, user),
			{
				excludeExtraneousValues: true,
			},
		);
	}

	@Post("code")
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Get a room code. Only for owner" })
	@ApiBody({
		type: GetRoomCodeDto,
		description: "The unique identifier of the game room to get the code.",
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Code was successfuly sent.",
		type: GetRoomCodeResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "The game room with the specified ID was not found.",
	})
	@ApiResponse({
		status: HttpStatus.FORBIDDEN,
		description: "Forbidden. The user is not an owner.",
	})
	getCode(
		@Body() dto: GetRoomCodeDto,
		@GetAuthenticatedUser() user: UserDto,
	) {
		this.logger.log(
			`Received getCode request with body=${JSON.stringify(dto)} userId=${user.id}`,
		);
		return plainToInstance(
			GetRoomCodeResponseDto,
			this.gameFacade.getRoomCode(dto, user),
			{ excludeExtraneousValues: true },
		);
	}

	@Get("current")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: "Get the ID of the room the user is currently in",
	})
	@ApiResponse({
		type: CurrentGameResponseDto,
		status: 200,
		description: "Returns roomId or null",
	})
	async getMyCurrentGame(@GetAuthenticatedUser() user: UserDto) {
		this.logger.log(
			`Received getMyCurrentGame request for userId=${user.id}`,
		);
		return plainToInstance(
			CurrentGameResponseDto,
			await this.playerFacade.getGameIdByUserId(user.id),
			{ excludeExtraneousValues: true },
		);
	}
	@Post("validate-code")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Validate a game room code" })
	@ApiBody({
		type: ValidateCodeDto,
		description: "The code and room ID to validate.",
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description:
			"Returns whether the code is valid for the specified room.",
		type: ValidateCodeResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "The game room with the specified ID was not found.",
	})
	async validateCode(@Body() dto: ValidateCodeDto) {
		this.logger.log(
			`Received validateCode request with body=${JSON.stringify(dto)}`,
		);
		return plainToInstance(
			ValidateCodeResponseDto,
			{ valid: await this.gameFacade.validateCode(dto.roomId, dto.code) },
			{ excludeExtraneousValues: true },
		);
	}
	@Get(":id/voice-token")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({
		summary: "Get a token to join the voice channel for a game room",
	})
	@ApiParam({
		name: "id",
		description: "The unique identifier of the game room.",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Returns a token to join the voice channel.",
		type: GetVoiceTokenResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "The game room with the specified ID was not found.",
	})
	async getVoiceRoomToken(
		@Param("id") roomId: string,
		@GetAuthenticatedUser() user: UserDto,
	) {
		const token = await this.voiceService.joinGameRoom(roomId, user.id);
		return plainToInstance(
			GetVoiceTokenResponseDto,
			{ token },
			{ excludeExtraneousValues: true },
		);
	}
}
