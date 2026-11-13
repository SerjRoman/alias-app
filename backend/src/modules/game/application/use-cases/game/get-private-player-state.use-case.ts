import {
	GameStatus,
	RoundStatus,
	EconomyService,
	ShopService,
	type WordItem,
	type ShopInventoryItem,
} from "../../../domain";
import { GameSharedService } from "../../game-shared.service";
import { Injectable } from "@nestjs/common";

export interface PrivatePlayerStateResult {
	word: WordItem | null;
	balance: number;
	inventory: ShopInventoryItem[];
	addons: {
		economy: { balance: number };
		shop: { inventory: ShopInventoryItem[] };
	};
}

@Injectable()
export class GetPrivatePlayerStateUseCase {
	constructor(private readonly gameSharedService: GameSharedService) {}

	async execute(
		roomId: string,
		userId: string,
	): Promise<PrivatePlayerStateResult> {
		const room = await this.gameSharedService.loadGame(roomId);
		const state = room.getState();

		const isExplainer =
			state.status === GameStatus.IN_PROGRESS &&
			state.currentRound?.status === RoundStatus.IN_PROGRESS &&
			state.currentRound?.explainerId === userId;

		const word = isExplainer
			? (state.currentRound?.currentWord ?? null)
			: null;
		const balance = EconomyService.getBalance(state, userId);
		const inventory = ShopService.getInventory(state, userId);

		return {
			word,
			balance,
			inventory,
			addons: {
				economy: { balance },
				shop: { inventory },
			},
		};
	}
}
