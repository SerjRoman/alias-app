import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { type UserDto } from "../../../auth/dto/user.dto";
import { type StartRoundDto } from "../../dto/body";
import { GameSharedService } from "../game-shared.service";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "../game.repository.interface";
import { RoundScheduler } from "../round-scheduler.service";
import { StartRoundUseCase } from "../use-cases/round/start-round.use-case";
import { ToggleRoundReadyUseCase } from "../use-cases/round/toggle-round-ready.use-case";

@Injectable()
export class RoundFacade {
	private readonly startRoundUseCase: StartRoundUseCase;
	private readonly toggleRoundReadyUseCase: ToggleRoundReadyUseCase;

	constructor(
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
		private readonly gameSharedService: GameSharedService,
		private readonly eventEmitter: EventEmitter2,
		private readonly roundScheduler: RoundScheduler,
	) {
		this.startRoundUseCase = new StartRoundUseCase(
			this.gameSharedService,
			this.repository,
			this.eventEmitter,
			this.roundScheduler,
		);
		this.toggleRoundReadyUseCase = new ToggleRoundReadyUseCase(
			this.gameSharedService,
			this.eventEmitter,
			this.repository,
		);
	}

	async startRound(dto: StartRoundDto, actor: UserDto) {
		return this.startRoundUseCase.execute(dto, actor.id);
	}

	async toggleRoundReady(roomId: string, actor: UserDto) {
		return this.toggleRoundReadyUseCase.execute(roomId, actor.id);
	}
}
