import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AuthenticatedUser } from "../types/authenticated-user";
import type { JwtPayload } from "../types/jwt-payload";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
	constructor(configService: ConfigService) {
		const secretKey = configService.getOrThrow<string>("JWT_SECRET_KEY");
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: true,
			secretOrKey: secretKey,
		});
	}

	validate(payload: JwtPayload): AuthenticatedUser {
		return {
			id: payload.sub,
			name: payload.name,
			role: payload.role,
		};
	}
}
