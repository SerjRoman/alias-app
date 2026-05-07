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

	async generateAccessToken(payload: JwtPayload): Promise<string> {
		const accesssToken = await this.jwtService.signAsync(payload, {
			secret: this.configService.getOrThrow<string>("JWT_SECRET_KEY"),
			expiresIn: this.configService.getOrThrow<string>(
				"JWT_EXPIRES_IN",
			) as StringValue,
		});
		return accesssToken;
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
}
