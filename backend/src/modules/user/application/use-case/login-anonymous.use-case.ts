import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { AnonymousLoginDto } from "../dto/anonymous-login.dto";
import { TokenService } from "../token.service";
import { JwtPayload } from "@common/types/jwt-payload";

@Injectable()
export class LoginAnonymousUseCase {
	constructor(private readonly tokenService: TokenService) {}

	async execute(dto: AnonymousLoginDto) {
		const userId = uuidv4();
		const payload: JwtPayload = {
			sub: userId,
			name: dto.name,
			role: "anonymous",
		};
		const accessToken =
			await this.tokenService.generateAccessToken(payload);

		return {
			accessToken,
			user: { id: userId, name: dto.name, role: "anonymous" },
		};
	}
}
