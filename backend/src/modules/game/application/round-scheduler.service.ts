import { Injectable, Logger, Inject } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "./game.repository.interface";

interface TimeoutMetadata {
	callback: () => void;
	endTime: number;
}

@Injectable()
export class RoundScheduler {
	private readonly logger = new Logger(RoundScheduler.name);
	private readonly timeoutsMetadata = new Map<string, TimeoutMetadata>();

	constructor(
		private readonly schedulerRegistry: SchedulerRegistry,
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
	) {}

	scheduleRoundTimeout(
		roomId: string,
		milliseconds: number,
		callback: () => void,
	) {
		const timeoutName = `round-timeout-${roomId}`;

		const wrappedCallback = () => {
			this.timeoutsMetadata.delete(timeoutName);
			callback();
		};

		const timeout = setTimeout(wrappedCallback, milliseconds);

		this.timeoutsMetadata.set(timeoutName, {
			callback,
			endTime: Date.now() + milliseconds,
		});

		if (this.schedulerRegistry.doesExist("timeout", timeoutName)) {
			this.schedulerRegistry.deleteTimeout(timeoutName);
		}
		this.schedulerRegistry.addTimeout(timeoutName, timeout);
	}

	changeRoundTime(roomId: string, timeDeltaMs: number) {
		const timeoutName = `round-timeout-${roomId}`;

		const metadata = this.timeoutsMetadata.get(timeoutName);
		if (
			!metadata ||
			!this.schedulerRegistry.doesExist("timeout", timeoutName)
		) {
			return;
		}

		const remainingTime = metadata.endTime - Date.now();
		const { callback } = metadata;

		const existingTimeout = this.schedulerRegistry.getTimeout(timeoutName);
		clearTimeout(existingTimeout);
		this.schedulerRegistry.deleteTimeout(timeoutName);
		this.timeoutsMetadata.delete(timeoutName);

		const newDuration = remainingTime + timeDeltaMs;

		if (newDuration > 0) {
			this.scheduleRoundTimeout(roomId, newDuration, callback);
		} else {
			callback();
		}
		return newDuration;
	}

	clearRoundTimeout(roomId: string) {
		const timeoutName = `round-timeout-${roomId}`;
		if (this.schedulerRegistry.doesExist("timeout", timeoutName)) {
			this.schedulerRegistry.deleteTimeout(timeoutName);
			this.timeoutsMetadata.delete(timeoutName);
		}
	}

	scheduleGameDeletion(roomId: string, milliseconds: number) {
		const timeoutName = `game-deletion-${roomId}`;

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
