import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { LoginDto } from "../dto/login.dto";
import { TokenService } from "../token.service";
import {
	USER_REPOSITORY,
	type IUserRepository,
} from "../user.repository.interface";
import { JwtPayload } from "@common/types/jwt-payload";
import { RedisService } from "@common/infrastructure/redis/redis.service";

@Injectable()
export class LoginRegisteredUseCase {
	private readonly REFRESH_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
		private readonly tokenService: TokenService,
		private readonly redisService: RedisService,
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
		const refreshToken =
			await this.tokenService.generateRefreshToken(payload);

		await this.redisService.set(
			`user-refresh:${user.id}`,
			refreshToken,
			"EX",
			this.REFRESH_TTL,
		);

		return {
			accessToken,
			refreshToken,
			user: { id: user.id, name: user.username, role: "registered" },
		};
	}
}
