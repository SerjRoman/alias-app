import { plainToInstance } from "class-transformer";
import { IUserRepository } from "../user.repository.interface";
import { UserShortInfoResponseDto } from "../dto/user-short-info.dto";

export class GetUsersShortInfoUseCase {
	constructor(private readonly userRepository: IUserRepository) {}
	async execute(userIds: string[]) {
		return plainToInstance(
			UserShortInfoResponseDto,
			(await this.userRepository.findManyByIds(userIds)).map((user) =>
				user.toPrimitives(),
			),
			{ excludeExtraneousValues: true },
		);
	}
}
