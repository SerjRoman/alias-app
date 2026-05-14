import { JwtAuthGuard } from "@common/guards/auth.guard";
import {
	Controller,
	Get,
	Logger,
	Param,
	Query,
	UseGuards,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiProperty,
	ApiParam,
} from "@nestjs/swagger";
import { FindAllGamesByUserIdUseCase } from "../application/use-case/find-all-games-by-user-id";
import { GetRoundDetailsUseCase } from "../application/use-case/get-round-details.use-case";
import { FindRoundsByGameIdUseCase } from "../application/use-case/find-rounds-by-game-id.use-case";
import { FindAllGamesByUserIdDto } from "../application/dto/find-all-games-by-user-id.dto";
import { FindRoundsByGameIdDto } from "../application/dto/find-rounds-by-game-id.dto";
import { plainToClass, plainToInstance } from "class-transformer";
import {
	GameSummaryResponseDto,
	PaginatedGameSummaryResponse,
} from "../application/dto/game-summary.dto";
import {
	PaginatedRoundDetailsResponse,
	RoundDetailsResponseDto,
} from "../application/dto/round-details.dto";
import { PaginatedResponseDto } from "@common/dto/paginated-response.dto";
import { PaginationQueryDto } from "@common/dto/pagination-query.dto";
import { GetAuthenticatedUser } from "@common/decorators/get-authenticated-user";
import { type AuthenticatedUser } from "@common/types/authenticated-user";

@ApiTags("history")
@Controller("history")
export class HistoryController {
	private readonly logger = new Logger(HistoryController.name);

	constructor(
		private readonly findAllGamesByUserIdUseCase: FindAllGamesByUserIdUseCase,
		private readonly getRoundDetailsUseCase: GetRoundDetailsUseCase,
		private readonly findRoundsByGameIdUseCase: FindRoundsByGameIdUseCase,
	) {}

	@Get("/games/:userId")
	@ApiBearerAuth()
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: "Get all completed games summaries for a user" })
	@ApiResponse({
		status: 200,
		description: "List of game summaries",
		type: PaginatedGameSummaryResponse,
	})
	@ApiParam({
		name: "userId",
		description: "The ID of the user whose game history is being requested",
		example: "123e4567-e89b-12d3-a456-426614174000",
	})
	async getGamesByUserId(
		@GetAuthenticatedUser() user: AuthenticatedUser,
		@Query() paginationQuery: PaginationQueryDto,
	): Promise<PaginatedResponseDto<GameSummaryResponseDto>> {
		this.logger.log(
			`Received getGamesByUserId request with userId=${user.id}`,
		);
		const dto = plainToClass(FindAllGamesByUserIdDto, {
			userId: user.id,
			...paginationQuery,
		});
		const gamesPaginated =
			await this.findAllGamesByUserIdUseCase.execute(dto);
		this.logger.log(
			`${JSON.stringify(gamesPaginated)} games found for user ID ${user.id}`,
		);
		return plainToInstance(
			PaginatedResponseDto<GameSummaryResponseDto>,
			gamesPaginated,
			{
				excludeExtraneousValues: true,
			},
		);
	}

	@Get("/games/:gameId/rounds")
	@ApiBearerAuth()
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: "Get paginated rounds for a specific game" })
	@ApiResponse({
		status: 200,
		description: "List of round details",
		type: PaginatedRoundDetailsResponse,
	})
	async getRoundsByGameId(
		@Param("gameId") gameId: string,
		@Query() paginationQuery: PaginationQueryDto,
	): Promise<PaginatedResponseDto<RoundDetailsResponseDto>> {
		this.logger.log(
			`Received getRoundsByGameId request with gameId=${gameId}`,
		);
		const dto = plainToClass(FindRoundsByGameIdDto, {
			gameId,
			...paginationQuery,
		});
		const roundsPaginated =
			await this.findRoundsByGameIdUseCase.execute(dto);
		return plainToInstance(
			PaginatedResponseDto<RoundDetailsResponseDto>,
			roundsPaginated,
			{
				excludeExtraneousValues: true,
			},
		);
	}

	@Get("/rounds/:roundId")
	@ApiBearerAuth()
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: "Get details for a specific round" })
	@ApiResponse({
		status: 200,
		description: "Round details",
		type: RoundDetailsResponseDto,
	})
	async getRoundDetails(
		@Param("roundId") roundId: string,
	): Promise<RoundDetailsResponseDto> {
		this.logger.log(
			`Received getRoundDetails request with roundId=${roundId}`,
		);
		const roundDetails = await this.getRoundDetailsUseCase.execute(roundId);
		return plainToInstance(RoundDetailsResponseDto, roundDetails, {
			excludeExtraneousValues: true,
		});
	}
}
