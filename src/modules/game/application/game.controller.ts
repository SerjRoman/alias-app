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
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { GameService } from "./game.service";
import { CreateGameDto } from "./dto/body/create-game.dto";
import { GetUserFromToken } from "../../../common/decorators/get-user-from-token";
import type { UserFromToken } from "../../../common/types/user-from-token";
import { plainToInstance } from "class-transformer";
import { GameResponseDto, CreateGameResponseDto } from "./dto/response";
import { JwtAuthGuard } from "../../../common/guards/auth.guard";
import { JoinGameDto } from "./dto/body";

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
		return plainToInstance(GameResponseDto, rooms, {
			excludeExtraneousValues: true,
		});
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
	create(
		@Body() body: CreateGameDto,
		@GetUserFromToken() user: UserFromToken,
	) {
		return plainToInstance(
			CreateGameResponseDto,
			this.service.create(body, user),
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
		@GetUserFromToken() user: UserFromToken,
	) {
		return this.service.delete(id, user);
	}

	@Post(":roomId/join")
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	@ApiBearerAuth()
	@ApiOperation({ summary: "Join a game room" })
	@ApiParam({
		name: "roomId",
		description: "The unique identifier of the game room to join.",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
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
	join(
		@Param() { roomId }: JoinGameDto,
		@GetUserFromToken() user: UserFromToken,
	) {
		return plainToInstance(
			GameResponseDto,
			this.service.joinGame(roomId, user),
			{
				excludeExtraneousValues: true,
			},
		);
	}
}
