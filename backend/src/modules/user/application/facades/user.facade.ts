import { Injectable } from "@nestjs/common";
import { AuthenticatedUser } from "@common/types/authenticated-user";
import { AnonymousLoginDto } from "../dto/anonymous-login.dto";
import { LoginDto } from "../dto/login.dto";
import { RegisterDto } from "../dto/register.dto";
import { GetMeUseCase } from "../use-case/get-me.use-case";
import { LoginAnonymousUseCase } from "../use-case/login-anonymous.use-case";
import { LoginRegisteredUseCase } from "../use-case/login-registered.use-case";
import { RegisterUseCase } from "../use-case/register.use-case";
import { GetUserByIdUseCase } from "../use-case/get-user-by-id.use-case";
import { UpdateAvatarUseCase } from "../use-case/update-avatar.use-case";
import { GetUsersShortInfoUseCase } from "../use-case/get-users-short-info.use-case";
import { GetUserProfileUseCase } from "../use-case/get-user-profile.use-case";

@Injectable()
export class UserFacade {
	constructor(
		private readonly getMeUseCase: GetMeUseCase,
		private readonly loginAnonymousUseCase: LoginAnonymousUseCase,
		private readonly loginRegisteredUseCase: LoginRegisteredUseCase,
		private readonly registerUseCase: RegisterUseCase,
		private readonly getUserByIdUseCase: GetUserByIdUseCase,
		private readonly updateAvatarUseCase: UpdateAvatarUseCase,
		private readonly getUsersShortInfoUseCase: GetUsersShortInfoUseCase,
		private readonly getUserProfileUseCase: GetUserProfileUseCase,
	) {}

	async getMe(user: AuthenticatedUser) {
		return this.getMeUseCase.execute(user);
	}

	async loginAnonymous(dto: AnonymousLoginDto) {
		return this.loginAnonymousUseCase.execute(dto);
	}

	async loginRegistered(dto: LoginDto) {
		return this.loginRegisteredUseCase.execute(dto);
	}

	async register(dto: RegisterDto) {
		return this.registerUseCase.execute(dto);
	}

	async getUserById(userId: string) {
		return this.getUserByIdUseCase.execute(userId);
	}

	async updateAvatar(userId: string, newAvatarUrl: string) {
		return this.updateAvatarUseCase.execute(userId, newAvatarUrl);
	}

	async getUsersShortInfo(userIds: string[]) {
		return this.getUsersShortInfoUseCase.execute(userIds);
	}

	async getUserProfile(userId: string) {
		return this.getUserProfileUseCase.execute(userId);
	}
}
