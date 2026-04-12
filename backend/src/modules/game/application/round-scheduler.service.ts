import { Injectable, Logger, Inject } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "./game.repository.interface";

@Injectable()
export class RoundScheduler {
	private readonly logger = new Logger(RoundScheduler.name);

	constructor(
		private readonly schedulerRegistry: SchedulerRegistry,
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
	) {}

	scheduleRoundTimeout(
		roomId: string,
		milliseconds: number,
		onTimeout: () => void,
	) {
		const timeoutName = `round_timeout_${roomId}`;

		if (this.schedulerRegistry.doesExist("timeout", timeoutName)) {
			this.clearRoundTimeout(roomId);
		}

		const timeout = setTimeout(() => {
			this.logger.log(`Time is up for room ${roomId}`);
			onTimeout();
		}, milliseconds);

		this.schedulerRegistry.addTimeout(timeoutName, timeout);
	}

	clearRoundTimeout(roomId: string) {
		const timeoutName = `round_timeout_${roomId}`;
		if (this.schedulerRegistry.doesExist("timeout", timeoutName)) {
			this.schedulerRegistry.deleteTimeout(timeoutName);
		}
	}

	scheduleGameDeletion(roomId: string, milliseconds: number) {
		const timeoutName = `game_deletion_${roomId}`;

		const timeout = setTimeout(() => {
			this.logger.log(
				`Deleting game ${roomId} after 24 hours of being finished`,
			);
			try {
				void this.repository.deleteGame(roomId);
				this.logger.log(`Game ${roomId} deleted successfully`);
			} catch (error) {
				this.logger.error(`Failed to delete game ${roomId}: ${error}`);
			}
		}, milliseconds);

		this.schedulerRegistry.addTimeout(timeoutName, timeout);
	}
}
