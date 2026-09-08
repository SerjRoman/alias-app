import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { TokenService } from "../token.service";
import {
	USER_REPOSITORY,
	type IUserRepository,
} from "../user.repository.interface";
import { RedisService } from "@common/infrastructure/redis/redis.service";
import { JwtPayload } from "@common/types/jwt-payload";

@Injectable()
export class RefreshTokenUseCase {
	private readonly REFRESH_PREFIX = "user-refresh:";
	private readonly REFRESH_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
		private readonly tokenService: TokenService,
		private readonly redisService: RedisService,
	) {}

	async execute(dto: RefreshTokenDto) {
		const payload = await this.tokenService.verifyRefreshToken(
			dto.refreshToken,
		);

		if (payload.role !== "registered") {
			throw new UnauthorizedException(
				"Only registered users can refresh tokens",
			);
		}

		const key = `${this.REFRESH_PREFIX}${payload.sub}`;
		const storedToken = await this.redisService.get(key);

		if (!storedToken || storedToken !== dto.refreshToken) {
			throw new UnauthorizedException(
				"Refresh token is invalid or has been revoked",
			);
		}

		const user = await this.userRepository.findById(payload.sub);
		if (!user) {
			throw new UnauthorizedException("User not found");
		}

		const newPayload: JwtPayload = {
			sub: user.id,
			name: user.username,
			role: "registered",
		};

		const accessToken =
			await this.tokenService.generateAccessToken(newPayload);
		const refreshToken =
			await this.tokenService.generateRefreshToken(newPayload);

		await this.redisService.set(key, refreshToken, "EX", this.REFRESH_TTL);

		return {
			accessToken,
			refreshToken,
			user: { id: user.id, name: user.username, role: "registered" },
		};
	}
}
