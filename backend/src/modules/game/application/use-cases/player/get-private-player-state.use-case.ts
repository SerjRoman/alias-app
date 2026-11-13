import { EconomyService, ShopService } from "../../../domain";
import { GameSharedService } from "../../game-shared.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class GetPrivatePlayerStateUseCase {
	constructor(private readonly gameSharedService: GameSharedService) {}

	async execute(roomId: string, userId: string) {
		const room = await this.gameSharedService.loadGame(roomId);
		const state = room.getState();

		const balance = EconomyService.getBalance(state, userId);
		const inventory = ShopService.getInventory(state, userId);

		return {
			balance,
			inventory,
		};
	}
}
