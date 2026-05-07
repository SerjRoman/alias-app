import { Injectable, UnauthorizedException, Inject } from "@nestjs/common";
import {
	USER_REPOSITORY,
	type IUserRepository,
} from "../user.repository.interface";
import { AuthenticatedUser } from "@common/types/authenticated-user";

@Injectable()
export class GetMeUseCase {
	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
	) {}

	async execute(user: AuthenticatedUser) {
		if (user.role === "anonymous") {
			return { id: user.id, name: user.name, role: user.role };
		}

		const dbUser = await this.userRepository.findById(user.id);
		if (!dbUser) {
			throw new UnauthorizedException("User not found");
		}

		return {
			id: dbUser.id,
			name: dbUser.name,
			username: dbUser.username,
			email: dbUser.email,
			role: user.role,
		};
	}
}
