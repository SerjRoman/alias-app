import { Injectable } from "@nestjs/common";
import { type UserDto } from "../../../user/application/dto/user.dto";
import { type StartRoundDto } from "../../dto/body";
import { StartRoundUseCase } from "../use-cases/round/start-round.use-case";
import { ToggleRoundReadyUseCase } from "../use-cases/round/toggle-round-ready.use-case";

@Injectable()
export class RoundFacade {
    constructor(
        private readonly startRoundUseCase: StartRoundUseCase,
        private readonly toggleRoundReadyUseCase: ToggleRoundReadyUseCase,
    ) { }

    async startRound(dto: StartRoundDto, actor: UserDto) {
        return this.startRoundUseCase.execute(dto, actor.id);
    }

    async toggleRoundReady(roomId: string, actor: UserDto) {
        return this.toggleRoundReadyUseCase.execute(roomId, actor.id);
    }
}
