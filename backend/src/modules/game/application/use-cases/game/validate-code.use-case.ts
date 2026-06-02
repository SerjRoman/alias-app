import { Injectable } from "@nestjs/common";
import { GameSharedService } from "../../game-shared.service";

@Injectable()
export class ValidateCodeUseCase {
	constructor(private readonly gameSharedService: GameSharedService) {}

	async execute(roomId: string, code?: string) {
		return this.gameSharedService.validateCode(roomId, code);
	}
}
