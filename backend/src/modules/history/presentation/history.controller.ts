import { JwtAuthGuard } from "@common/guards/auth.guard";
import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from "@nestjs/swagger";
import { FindAllGamesByUserIdUseCase } from "../application/use-case/find-all-games-by-user-id";
import { FindAllGamesByUserIdDto } from "../application/dto/find-all-games-by-user-id.dto";
import { plainToClass, plainToInstance } from "class-transformer";
import { GameHistoryDetailsResponseDto } from "../application/dto/game-history-details.dto";

@ApiTags("history")
@Controller("history")
export class HistoryController {
	constructor(
		private readonly findAllGamesByUserIdUseCase: FindAllGamesByUserIdUseCase,
	) {}

	@Get("/games/:userId")
	@ApiBearerAuth()
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: "Get all completed games for a user" })
	@ApiResponse({
		status: 200,
		description: "List of games",
		type: [GameHistoryDetailsResponseDto],
	})
	async getGamesByUserId(
		@Param("userId") userId: string,
	): Promise<GameHistoryDetailsResponseDto[]> {
		const dto = plainToClass(FindAllGamesByUserIdDto, { userId });
		const games = await this.findAllGamesByUserIdUseCase.execute(dto);
		return plainToInstance(GameHistoryDetailsResponseDto, games, {
			excludeExtraneousValues: true,
		});
	}
}
