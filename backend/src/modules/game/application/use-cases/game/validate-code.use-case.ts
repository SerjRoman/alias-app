import type { GameSharedService } from "../../game-shared.service";

export class ValidateCodeUseCase {
	constructor(private readonly gameSharedService: GameSharedService) {}

	async execute(roomId: string, code?: string) {
		return this.gameSharedService.validateCode(roomId, code);
	}
}
