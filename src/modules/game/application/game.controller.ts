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
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiBody,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { GameService } from "./game.service";
import { GetUserFromToken } from "../../../common/decorators/get-user-from-token";
import { plainToInstance } from "class-transformer";
import {
	CreateGameResponseDto,
	CurrentGameResponseDto,
	GameResponseDto,
	GetRoomCodeResponseDto,
	ValidateCodeResponseDto,
} from "./dto/response";
import { JwtAuthGuard } from "../../../common/guards/auth.guard";
import {
	CreateGameDto,
	GetRoomCodeDto,
	JoinGameDto,
	ValidateCodeDto,
} from "./dto/body";
import { UserDto } from "../../auth/dto/user.dto";

@ApiTags("Games")
@Controller("games")
export class GameController {
	constructor(private readonly service: GameService) {}

	@Get()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: "Get all game rooms" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Returns all game rooms.",
		type: [GameResponseDto],
	})
	async getAll() {
		const rooms = await this.service.findAll();
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
		@GetUserFromToken() user: UserDto,
	) {
		const { room, code } = await this.service.create(body, user);
		console.log("Created game room with ID:", room.id, "and code:", code);
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
	delete(@Param() { id }: { id: string }, @GetUserFromToken() user: UserDto) {
		return this.service.delete(id, user);
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
	join(@Body() dto: JoinGameDto, @GetUserFromToken() user: UserDto) {
		return plainToInstance(
			GameResponseDto,
			this.service.joinGame(dto, user),
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
	getCode(@Body() dto: GetRoomCodeDto, @GetUserFromToken() user: UserDto) {
		return plainToInstance(
			GetRoomCodeResponseDto,
			this.service.getRoomCode(dto, user),
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
	async getMyCurrentGame(@GetUserFromToken() user: UserDto) {
		return plainToInstance(
			CurrentGameResponseDto,
			await this.service.getGameIdByUserId(user.id),
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
		return plainToInstance(
			ValidateCodeResponseDto,
			{ valid: await this.service.validateCode(dto.roomId, dto.code) },
			{ excludeExtraneousValues: true },
		);
	}
}
