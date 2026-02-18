import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, TokenExpiredError } from "@nestjs/jwt";
import { StringValue } from "ms";
import { TokenPayload } from "./auth.types";
import { UserFromToken } from "../../common/types/user-from-token";

@Injectable()
export class TokenService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}

	async generateAccessToken(payload: TokenPayload): Promise<string> {
		const accesssToken = await this.jwtService.signAsync(payload, {
			secret: this.configService.get<string>("ACCESS_SECRET_KEY"),
			expiresIn: this.configService.get<string>(
				"JWT_EXPIRES_IN",
			) as StringValue,
		});
		return accesssToken;
	}

	async verifyAccessToken(accessToken: string): Promise<UserFromToken> {
		try {
			return await this.jwtService.verifyAsync<UserFromToken>(
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
