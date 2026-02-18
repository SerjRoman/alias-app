import { Injectable } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";
import { v4 as uuidv4 } from "uuid";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
	constructor(
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) {}
	login(loginDto: LoginDto) {
		const userId = uuidv4();
		const payload = { sub: userId, name: loginDto.name };

		return {
			accessToken: this.jwtService.sign(payload, {
				secret: this.configService.getOrThrow<string>("JWT_SECRET_KEY"),
			}),
			user: {
				id: userId,
				name: loginDto.name,
			},
		};
	}
}
