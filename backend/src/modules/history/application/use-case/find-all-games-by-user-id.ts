import { Inject } from "@nestjs/common";
import {
	HISTORY_REPOSITORY,
	type IHistoryRepository,
} from "../history.repository";
import { FindAllGamesByUserIdDto } from "../dto/find-all-games-by-user-id.dto";

export class FindAllGamesByUserIdUseCase {
	constructor(
		@Inject(HISTORY_REPOSITORY)
		private readonly repository: IHistoryRepository,
	) {}
	public async execute(dto: FindAllGamesByUserIdDto) {
		return (
			await this.repository.findGamesByUserIdWithRelations(dto.userId)
		).map((game) => game.toPrimitives());
	}
}
