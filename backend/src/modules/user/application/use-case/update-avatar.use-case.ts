import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import {
	USER_REPOSITORY,
	type IUserRepository,
} from "../user.repository.interface";

@Injectable()
export class UpdateAvatarUseCase {
	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
	) {}

	async execute(
		userId: string,
		newAvatarUrl: string,
	): Promise<{ oldAvatarUrl: string | null }> {
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw new NotFoundException("User not found");
		}

		const oldAvatarUrl = user.avatarUrl;

		user.updateProfile({ avatarUrl: newAvatarUrl });
		await this.userRepository.save(user);

		return { oldAvatarUrl };
	}
}
