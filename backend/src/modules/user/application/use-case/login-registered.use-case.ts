import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { LoginDto } from "../dto/login.dto";
import { TokenService } from "../token.service";
import {
	USER_REPOSITORY,
	type IUserRepository,
} from "../user.repository.interface";
import { JwtPayload } from "@common/types/jwt-payload";

@Injectable()
export class LoginRegisteredUseCase {
	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
		private readonly tokenService: TokenService,
	) {}

	async execute(dto: LoginDto) {
		const user = await this.userRepository.findByEmail(dto.email);
		if (!user) {
			throw new UnauthorizedException("Invalid credentials");
		}

		const isPasswordValid = await bcrypt.compare(
			dto.password,
			user.password,
		);
		if (!isPasswordValid) {
			throw new UnauthorizedException("Invalid credentials");
		}

		const payload: JwtPayload = {
			sub: user.id,
			name: user.username,
			role: "registered",
		};
		const accessToken =
			await this.tokenService.generateAccessToken(payload);

		return {
			accessToken,
			user: { id: user.id, name: user.username, role: "registered" },
		};
	}
}
