import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { UserProfileDto } from "../dto/user-profile.dto";
import {
	USER_REPOSITORY,
	type IUserRepository,
} from "../user.repository.interface";
import { plainToInstance } from "class-transformer";
@Injectable()
export class GetUserProfileUseCase {
	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
	) {}
	async execute(userId: string): Promise<UserProfileDto> {
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw new NotFoundException(`User with id ${userId} not found`);
		}
		return plainToInstance(UserProfileDto, user.toPrimitives(), {
			excludeExtraneousValues: true,
		});
	}
}
