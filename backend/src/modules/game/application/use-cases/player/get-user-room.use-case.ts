import { type IGameRepository } from "../../game.repository.interface";

export class GetUserRoomUseCase {
	constructor(private readonly gameRepository: IGameRepository) {}
	async execute(userId: string) {
		const roomId = await this.gameRepository.getUserRoom(userId);
		return roomId;
	}
}
