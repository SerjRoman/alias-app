import { Injectable } from "@nestjs/common";
import { StartRoundUseCase } from "../use-cases/round/start-round.use-case";
import { ToggleRoundReadyUseCase } from "../use-cases/round/toggle-round-ready.use-case";
import { UserDto } from "@common/dto/user.dto";
import {
	ChangeRoundTimeDto,
	EndPointingDto,
	StartRoundDto,
	StartPointingDto,
	SetExplainerDto,
	PauseGameDto,
	ResumeGameDto,
	GetExplainerWordDto,
} from "../dto/body";
import { EndPointingUseCase } from "../use-cases/round/end-pointing.use-case";
import { SetExplainerUseCase } from "../use-cases/round/set-explainer.use-case";
import { ChangeRoundTimeUseCase } from "../use-cases/round/change-round-time.use-case";
import { StartPointingUseCase } from "../use-cases/round/start-pointing.use-case";
import { StartRoundForcedUseCase } from "../use-cases/round/start-round-forced.use-case";
import { PauseRoundUseCase } from "../use-cases/round/pause-round.use-case";
import { ResumeRoundUseCase } from "../use-cases/round/resume-round.use-case";
import { GetExplainerWordUseCase } from "../use-cases/round/get-explainer-word.use-case";

@Injectable()
export class RoundFacade {
	constructor(
		private readonly startRoundUseCase: StartRoundUseCase,
		private readonly toggleRoundReadyUseCase: ToggleRoundReadyUseCase,
		private readonly endPointingUseCase: EndPointingUseCase,
		private readonly setExplainerUseCase: SetExplainerUseCase,
		private readonly changeRoundTimeUseCase: ChangeRoundTimeUseCase,
		private readonly startPointingUseCase: StartPointingUseCase,
		private readonly startRoundForcedUseCase: StartRoundForcedUseCase,
		private readonly pauseRoundUseCase: PauseRoundUseCase,
		private readonly resumeRoundUseCase: ResumeRoundUseCase,
		private readonly getExplainerWordUseCase: GetExplainerWordUseCase,
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
	async pauseRound(dto: PauseGameDto, actor: UserDto) {
		return this.pauseRoundUseCase.execute(dto, actor);
	}
	async resumeRound(dto: ResumeGameDto, actor: UserDto) {
		return this.resumeRoundUseCase.execute(dto, actor);
	}

	async getExplainerWord(dto: GetExplainerWordDto, actor: UserDto) {
		return this.getExplainerWordUseCase.execute(dto, actor);
	}
}
