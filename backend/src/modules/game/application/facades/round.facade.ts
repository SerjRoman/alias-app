import { Injectable } from "@nestjs/common";
import { StartRoundUseCase } from "../use-cases/round/start-round.use-case";
import { ToggleRoundReadyUseCase } from "../use-cases/round/toggle-round-ready.use-case";
import { UserDto } from "@common/dto/user.dto";
import {
	ChangeRoundTimeDto,
	EndPointingDto,
	FinishRoundDto,
	StartRoundDto,
	StartPointingDto,
	SetExplainerDto,
} from "../dto/body";
import { EndPointingUseCase } from "../use-cases/round/end-pointing.use-case";
import { FinishRoundUseCase } from "../use-cases/round/finish-round.use-case";
import { SetExplainerUseCase } from "../use-cases/round/set-explainer.use-case";
import { ChangeRoundTimeUseCase } from "../use-cases/round/change-round-time.use-case";
import { StartPointingUseCase } from "../use-cases/round/start-pointing.use-case";
import { StartRoundForcedUseCase } from "../use-cases/round/start-round-forced.use-case";

@Injectable()
export class RoundFacade {
	constructor(
		private readonly startRoundUseCase: StartRoundUseCase,
		private readonly toggleRoundReadyUseCase: ToggleRoundReadyUseCase,
		private readonly endPointingUseCase: EndPointingUseCase,
		private readonly finishRoundUseCase: FinishRoundUseCase,
		private readonly setExplainerUseCase: SetExplainerUseCase,
		private readonly changeRoundTimeUseCase: ChangeRoundTimeUseCase,
		private readonly startPointingUseCase: StartPointingUseCase,
		private readonly startRoundForcedUseCase: StartRoundForcedUseCase,
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
	async setExplainer(dto: SetExplainerDto, actor: UserDto) {
		return this.setExplainerUseCase.execute(dto, actor);
	}
	async changeRoundTime(dto: ChangeRoundTimeDto, actor: UserDto) {
		return this.changeRoundTimeUseCase.execute(dto, actor);
	}
	async startPointing(dto: StartPointingDto, actor: UserDto) {
		return this.startPointingUseCase.execute(dto, actor);
	}
	async startRoundForced(dto: StartRoundDto, actor: UserDto) {
		return this.startRoundForcedUseCase.execute(dto, actor);
	}
}
