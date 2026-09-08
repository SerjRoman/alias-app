import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, TokenExpiredError } from "@nestjs/jwt";
import { StringValue } from "ms";
import { AuthenticatedUser } from "@common/types/authenticated-user";
import { JwtPayload } from "@common/types/jwt-payload";

@Injectable()
export class TokenService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	async generateGuestToken(payload: JwtPayload): Promise<string> {
		const expiresIn = (this.configService.get<string>(
			"JWT_GUEST_EXPIRES_IN",
		) ?? "365d") as StringValue;
		return this.jwtService.signAsync(payload, {
			secret: this.configService.getOrThrow<string>("JWT_SECRET_KEY"),
			expiresIn,
		});
	}

	async generateAccessToken(payload: JwtPayload): Promise<string> {
		const expiresIn = (this.configService.get<string>(
			"JWT_ACCESS_EXPIRES_IN",
		) ??
			this.configService.get<string>("JWT_EXPIRES_IN") ??
			"15m") as StringValue;
		return this.jwtService.signAsync(payload, {
			secret: this.configService.getOrThrow<string>("JWT_SECRET_KEY"),
			expiresIn,
		});
	}

	async generateRefreshToken(payload: JwtPayload): Promise<string> {
		const expiresIn = (this.configService.get<string>(
			"JWT_REFRESH_EXPIRES_IN",
		) ?? "30d") as StringValue;
		const secret =
			this.configService.get<string>("JWT_REFRESH_SECRET_KEY") ??
			this.configService.getOrThrow<string>("JWT_SECRET_KEY");
		return this.jwtService.signAsync(
			{ ...payload, tokenType: "refresh" },
			{
				secret,
				expiresIn,
			},
		);
	}

	async verifyAccessToken(accessToken: string): Promise<AuthenticatedUser> {
		try {
			return await this.jwtService.verifyAsync<AuthenticatedUser>(
				accessToken,
				{
					secret: this.configService.getOrThrow<string>(
						"JWT_SECRET_KEY",
					),
				},
			);
		} catch (error) {
			if (error instanceof TokenExpiredError) {
				throw new UnauthorizedException("Access token expired");
			}
			throw new UnauthorizedException("Invalid access token");
		}
	}

	async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
		try {
			const secret =
				this.configService.get<string>("JWT_REFRESH_SECRET_KEY") ??
				this.configService.getOrThrow<string>("JWT_SECRET_KEY");
			const payload = await this.jwtService.verifyAsync<
				JwtPayload & { tokenType?: string }
			>(refreshToken, { secret });
			return {
				sub: payload.sub,
				name: payload.name,
				role: payload.role,
			};
		} catch (error) {
			if (error instanceof TokenExpiredError) {
				throw new UnauthorizedException("Refresh token expired");
			}
			throw new UnauthorizedException("Invalid refresh token");
		}
	}
}
