import type { IGameRepository } from "../../game.repository.interface";

export class GetCurrentGameUseCase {
	constructor(private readonly gameRepository: IGameRepository) {}

	async execute(userId: string) {
		const roomId = await this.gameRepository.getUserRoom(userId);
		return { roomId };
	}
}
