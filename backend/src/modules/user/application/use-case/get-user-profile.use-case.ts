import { NotFoundException } from "@nestjs/common";
import { UserProfileDto } from "../dto/user-profile.dto";
import { IUserRepository } from "../user.repository.interface";
import { plainToInstance } from "class-transformer";

export class GetUserProfileUseCase {
	constructor(private readonly userRepository: IUserRepository) {}
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
