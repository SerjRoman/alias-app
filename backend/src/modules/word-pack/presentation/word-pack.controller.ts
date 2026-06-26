import {
	Controller,
	Get,
	Param,
	HttpCode,
	HttpStatus,
	UseGuards,
	NotFoundException,
	Post,
	Body,
} from "@nestjs/common";
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
	ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@common/guards/auth.guard";
import { GetAuthenticatedUser } from "@common/decorators/get-authenticated-user";
import { type AuthenticatedUser } from "@common/types/authenticated-user";
import { WordPackService } from "../application/word-pack.service";
import { WordPackResponseDto } from "../application/dto/word-pack-response.dto";
import { CreateWordPackDto } from "../application/dto/create-word-pack.dto";
import { plainToInstance } from "class-transformer";

@ApiTags("Word Packs")
@Controller("word-packs")
export class WordPackController {
	constructor(private readonly wordPackService: WordPackService) {}

	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: "Get all available word packs" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Returns a list of word packs.",
		type: [WordPackResponseDto],
	})
	async getPacks() {
		const packs = await this.wordPackService.getPacks();
		return plainToInstance(WordPackResponseDto, packs, {
			excludeExtraneousValues: true,
		});
	}

	@Get(":id")
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: "Get a specific word pack by ID" })
	@ApiParam({
		name: "id",
		description: "The unique identifier of the word pack.",
		example: "a1b2c3d4-e5f6-7890-1234-567890abcdef",
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: "Returns the word pack details.",
		type: WordPackResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: "The word pack with the specified ID was not found.",
	})
	async getPackById(@Param("id") id: string) {
		const pack = await this.wordPackService.getPackById(id);
		if (!pack) {
			throw new NotFoundException(`Word pack with ID ${id} not found`);
		}
		return plainToInstance(WordPackResponseDto, pack, {
			excludeExtraneousValues: true,
		});
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: "Create a new word pack" })
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: "The word pack has been successfully created.",
		type: WordPackResponseDto,
	})
	@ApiResponse({
		status: HttpStatus.BAD_REQUEST,
		description: "Invalid input data.",
	})
	async createPack(
		@Body() createWordPackDto: CreateWordPackDto,
		@GetAuthenticatedUser() user: AuthenticatedUser,
	) {
		const pack = await this.wordPackService.createPack(
			createWordPackDto.name,
			createWordPackDto.description ?? null,
			createWordPackDto.language,
			createWordPackDto.type,
			user.id,
			createWordPackDto.words,
		);
		return plainToInstance(WordPackResponseDto, pack, {
			excludeExtraneousValues: true,
		});
	}
}
