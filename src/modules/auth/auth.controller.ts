import { Controller, Post, Body, HttpStatus } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { LoginResponseDto } from "./dto/login-response.dto";
import { plainToInstance } from "class-transformer";

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
}
