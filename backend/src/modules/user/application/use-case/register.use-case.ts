import { Injectable, ConflictException, Inject } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { RegisterDto } from "../dto/register.dto";
import { TokenService } from "../token.service";
import {
	USER_REPOSITORY,
	type IUserRepository,
} from "../user.repository.interface";
import { UserEntity } from "../../domain/entities/user";
import { JwtPayload } from "@common/types/jwt-payload";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class RegisterUseCase {
	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
		private readonly tokenService: TokenService,
		private readonly configService: ConfigService,
	) {}

	async execute(dto: RegisterDto) {
		const existingUser = await this.userRepository.findByEmail(dto.email);
		if (existingUser) {
			throw new ConflictException("Email already exists");
		}

		const passwordHash = await bcrypt.hash(dto.password, 10);
		const defaultAvatarUrl = this.configService.getOrThrow<string>(
			"DEFAULT_USER_AVATAR_URL",
		);

		const user = UserEntity.create(
			dto.email,
			dto.name,
			dto.username,
			passwordHash,
			defaultAvatarUrl,
		);

		await this.userRepository.save(user);

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
