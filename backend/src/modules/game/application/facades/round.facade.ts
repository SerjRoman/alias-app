import { Injectable } from "@nestjs/common";
import { StartRoundUseCase } from "../use-cases/round/start-round.use-case";
import { ToggleRoundReadyUseCase } from "../use-cases/round/toggle-round-ready.use-case";
import { UserDto } from "@common/dto/user.dto";
import { EndPointingDto, FinishRoundDto, StartRoundDto } from "../dto/body";
import { EndPointingUseCase } from "../use-cases/round/end-pointing.use-case";
import { FinishRoundUseCase } from "../use-cases/round/finish-round.use-case";

@Injectable()
export class RoundFacade {
	constructor(
		private readonly startRoundUseCase: StartRoundUseCase,
		private readonly toggleRoundReadyUseCase: ToggleRoundReadyUseCase,
		private readonly endPointingUseCase: EndPointingUseCase,
		private readonly finishRoundUseCase: FinishRoundUseCase,
	) {}

	async startRound(dto: StartRoundDto, actor: UserDto) {
		return this.startRoundUseCase.execute(dto, actor);
	}

	async toggleRoundReady(roomId: string, actor: UserDto) {
		return this.toggleRoundReadyUseCase.execute(roomId, actor);
	}
	async endPointing(dto: EndPointingDto, actor: UserDto) {
		return this.endPointingUseCase.execute(dto, actor);
	}
	async finishRound(dto: FinishRoundDto, actor: UserDto) {
		return this.finishRoundUseCase.execute(dto, actor);
	}
}
