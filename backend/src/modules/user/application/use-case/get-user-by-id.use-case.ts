import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import {
	USER_REPOSITORY,
	type IUserRepository,
} from "../user.repository.interface";

@Injectable()
export class GetUserByIdUseCase {
	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
	) {}

	async execute(userId: string) {
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw new NotFoundException("User not found");
		}

		return {
			name: user.name,
			username: user.username,
			avatarUrl: user.avatarUrl,
		};
	}
}
