import {
	Controller,
	Post,
	Body,
	HttpStatus,
	Get,
	UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
} from "@nestjs/swagger";
import { LoginResponseDto } from "./dto/login-response.dto";
import { plainToInstance } from "class-transformer";
import { MeDtoResponse } from "./dto/me.dto";
import { GetUserFromToken } from "../../common/decorators/get-user-from-token";
import { UserDto } from "./dto/user.dto";
import { JwtAuthGuard } from "../../common/guards/auth.guard";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("login")
	@ApiOperation({ summary: "User login" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "The user has been successfully logged in.",
		type: LoginResponseDto,
	})
	login(@Body() loginDto: LoginDto): LoginResponseDto {
		return plainToInstance(
			LoginResponseDto,
			this.authService.login(loginDto),
		);
	}
	@Get("me")
	@ApiOperation({ summary: "Get current user info" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "The current user info has been successfully retrieved.",
		type: MeDtoResponse,
	})
	@ApiOperation({ summary: "Get current user info" })
	@ApiResponse({
		status: HttpStatus.OK,
		description: "The current user info has been successfully retrieved.",
		type: MeDtoResponse,
	})
	@ApiBearerAuth()
	@UseGuards(JwtAuthGuard)
	me(@GetUserFromToken() user: UserDto): MeDtoResponse {
		return plainToInstance(
			MeDtoResponse,
			{
				id: user.id,
				name: user.name,
			},
			{ excludeExtraneousValues: true },
		);
	}
}
