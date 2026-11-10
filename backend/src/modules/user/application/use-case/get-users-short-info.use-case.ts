import { plainToInstance } from "class-transformer";
import {
	USER_REPOSITORY,
	type IUserRepository,
} from "../user.repository.interface";
import { UserShortInfoResponseDto } from "../dto/user-short-info.dto";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class GetUsersShortInfoUseCase {
	constructor(
		@Inject(USER_REPOSITORY)
		private readonly userRepository: IUserRepository,
	) {}
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
