import { Injectable, Logger, Inject } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import {
	GAME_REPOSITORY,
	type IGameRepository,
} from "./game.repository.interface";

export interface ActiveRoomTimer {
	readonly id: string;
	readonly expiresAt: number;
	readonly callback: () => Promise<void> | void;
	readonly timeoutRef: NodeJS.Timeout;
}

export interface PausedRoomTimerMetadata {
	readonly id: string;
	readonly remainingMs: number;
	readonly callback: () => Promise<void> | void;
}

@Injectable()
export class RoundScheduler {
	private readonly logger = new Logger(RoundScheduler.name);
	private readonly roomTimers = new Map<string, ActiveRoomTimer[]>();
	private readonly pausedTimers = new Map<
		string,
		PausedRoomTimerMetadata[]
	>();

	constructor(
		private readonly schedulerRegistry: SchedulerRegistry,
		@Inject(GAME_REPOSITORY) private readonly repository: IGameRepository,
	) {}

	private getRegistryName(roomId: string, timerId: string): string {
		if (timerId === "round") {
			return `round-timeout-${roomId}`;
		}
		if (timerId === "owner-transfer") {
			return `owner-transfer-timeout-${roomId}`;
		}
		return `${timerId}-${roomId}`;
	}

	/**
	 * Schedules a timer for a specific room and timerId.
	 * Any existing active timer with the same timerId in this room is cancelled first.
	 */
	public scheduleTimer(
		roomId: string,
		timerId: string,
		milliseconds: number,
		callback: () => Promise<void> | void,
	): void {
		this.cancelTimer(roomId, timerId);

		const registryName = this.getRegistryName(roomId, timerId);
		const expiresAt = Date.now() + milliseconds;

		const wrappedCallback = () => {
			this.removeTimerFromState(roomId, timerId);
			if (this.schedulerRegistry.doesExist("timeout", registryName)) {
				this.schedulerRegistry.deleteTimeout(registryName);
			}
			callback();
		};

		const timeoutRef = setTimeout(wrappedCallback, milliseconds);

		if (this.schedulerRegistry.doesExist("timeout", registryName)) {
			this.schedulerRegistry.deleteTimeout(registryName);
		}
		this.schedulerRegistry.addTimeout(registryName, timeoutRef);

		const timers = this.roomTimers.get(roomId) ?? [];
		timers.push({
			id: timerId,
			expiresAt,
			callback,
			timeoutRef,
		});
		this.roomTimers.set(roomId, timers);
	}

	/**
	 * Cancels a specific timer by id in a room.
	 */
	public cancelTimer(roomId: string, timerId: string): void {
		const registryName = this.getRegistryName(roomId, timerId);
		if (this.schedulerRegistry.doesExist("timeout", registryName)) {
			this.schedulerRegistry.deleteTimeout(registryName);
		}

		this.removeTimerFromState(roomId, timerId);
		this.removePausedTimer(roomId, timerId);
	}

	/**
	 * Pauses a specific timer in a room and returns remaining milliseconds.
	 */
	public pauseTimer(roomId: string, timerId: string): number | null {
		const timers = this.roomTimers.get(roomId);
		if (!timers) return null;

		const index = timers.findIndex((t) => t.id === timerId);
		if (index === -1) return null;

		const [timer] = timers.splice(index, 1);
		clearTimeout(timer.timeoutRef);

		const registryName = this.getRegistryName(roomId, timerId);
		if (this.schedulerRegistry.doesExist("timeout", registryName)) {
			this.schedulerRegistry.deleteTimeout(registryName);
		}

		const remainingMs = Math.max(0, timer.expiresAt - Date.now());
		const pausedList = this.pausedTimers.get(roomId) ?? [];
		pausedList.push({
			id: timerId,
			remainingMs,
			callback: timer.callback,
		});
		this.pausedTimers.set(roomId, pausedList);

		return remainingMs;
	}

	/**
	 * Resumes a specific timer in a room with durationMs (or remainingMs if not provided).
	 */
	public resumeTimer(
		roomId: string,
		timerId: string,
		durationMs?: number,
		callback?: () => Promise<void> | void,
	): void {
		const pausedList = this.pausedTimers.get(roomId);
		const pausedEntry = pausedList?.find((p) => p.id === timerId);

		const actualCallback = callback ?? pausedEntry?.callback;
		const actualDuration = durationMs ?? pausedEntry?.remainingMs ?? 0;

		if (!actualCallback || actualDuration <= 0) {
			return;
		}

		this.removePausedTimer(roomId, timerId);
		this.scheduleTimer(roomId, timerId, actualDuration, actualCallback);
	}

	/**
	 * Pauses ALL active timers in a room and returns remaining milliseconds for each.
	 */
	public pauseAll(roomId: string): Map<string, number> {
		const remainingMap = new Map<string, number>();
		const timers = this.roomTimers.get(roomId);
		if (!timers || timers.length === 0) {
			return remainingMap;
		}

		while (timers.length > 0) {
			const timer = timers.pop();
			if (!timer) {
				break;
			}
			clearTimeout(timer.timeoutRef);

			const registryName = this.getRegistryName(roomId, timer.id);
			if (this.schedulerRegistry.doesExist("timeout", registryName)) {
				this.schedulerRegistry.deleteTimeout(registryName);
			}

			const remainingMs = Math.max(0, timer.expiresAt - Date.now());
			remainingMap.set(timer.id, remainingMs);

			const pausedList = this.pausedTimers.get(roomId) ?? [];
			pausedList.push({
				id: timer.id,
				remainingMs,
				callback: timer.callback,
			});
			this.pausedTimers.set(roomId, pausedList);
		}

		return remainingMap;
	}

	/**
	 * Resumes all paused timers in a room.
	 */
	public resumeAll(
		roomId: string,
		overrides?: Array<{
			id: string;
			remainingMs: number;
			callback?: () => Promise<void> | void;
		}>,
	): void {
		if (overrides) {
			for (const override of overrides) {
				this.resumeTimer(
					roomId,
					override.id,
					override.remainingMs,
					override.callback,
				);
			}
			return;
		}

		const pausedList = this.pausedTimers.get(roomId) ?? [];
		const toResume = [...pausedList];
		this.pausedTimers.delete(roomId);

		for (const item of toResume) {
			this.scheduleTimer(
				roomId,
				item.id,
				item.remainingMs,
				item.callback,
			);
		}
	}

	/**
	 * Clears and cancels ALL timers for a room (both running and paused).
	 */
	public clearRoom(roomId: string): void {
		const timers = this.roomTimers.get(roomId) ?? [];
		for (const timer of timers) {
			clearTimeout(timer.timeoutRef);
			const registryName = this.getRegistryName(roomId, timer.id);
			if (this.schedulerRegistry.doesExist("timeout", registryName)) {
				this.schedulerRegistry.deleteTimeout(registryName);
			}
		}
		this.roomTimers.delete(roomId);
		this.pausedTimers.delete(roomId);
	}

	// --- Convenience wrappers for Round, Owner Transfer, Effects ---

	public scheduleRoundTimeout(
		roomId: string,
		milliseconds: number,
		callback: () => Promise<void> | void,
	): void {
		this.scheduleTimer(roomId, "round", milliseconds, callback);
	}

	public pauseRoundTimeout(roomId: string): number | null {
		return this.pauseTimer(roomId, "round");
	}

	public resumeRoundTimeout(
		roomId: string,
		remainingMs?: number,
		callback?: () => Promise<void> | void,
	): void {
		this.resumeTimer(roomId, "round", remainingMs, callback);
	}

	public clearRoundTimeout(roomId: string): void {
		this.cancelTimer(roomId, "round");
	}

	public changeRoundTime(
		roomId: string,
		timeDeltaMs: number,
	): number | undefined {
		const timers = this.roomTimers.get(roomId);
		const timer = timers?.find((t) => t.id === "round");
		if (timer) {
			const remainingTime = timer.expiresAt - Date.now();
			const callback = timer.callback;
			const newDuration = remainingTime + timeDeltaMs;

			this.cancelTimer(roomId, "round");

			if (newDuration > 0) {
				this.scheduleRoundTimeout(roomId, newDuration, callback);
			} else {
				void callback();
			}
			return newDuration;
		}

		const paused = this.pausedTimers.get(roomId);
		const pausedTimer = paused?.find((p) => p.id === "round");
		if (paused && pausedTimer) {
			const newRemaining = Math.max(0, pausedTimer.remainingMs + timeDeltaMs);
			const idx = paused.indexOf(pausedTimer);
			paused[idx] = {
				id: pausedTimer.id,
				remainingMs: newRemaining,
				callback: pausedTimer.callback,
			};
			return newRemaining;
		}

		return undefined;
	}

	public scheduleOwnerTransferTimeout(
		roomId: string,
		milliseconds: number,
		callback: () => Promise<void> | void,
	): void {
		this.scheduleTimer(roomId, "owner-transfer", milliseconds, callback);
	}

	public clearOwnerTransferTimeout(roomId: string): void {
		this.cancelTimer(roomId, "owner-transfer");
	}

	public scheduleEffectTimeout(
		roomId: string,
		effectId: string,
		milliseconds: number,
		callback: () => Promise<void> | void,
	): void {
		this.scheduleTimer(
			roomId,
			`effect-${effectId}`,
			milliseconds,
			callback,
		);
	}

	public clearEffectTimeout(roomId: string, effectId: string): void {
		this.cancelTimer(roomId, `effect-${effectId}`);
	}

	public async scheduleGameDeletion(
		roomId: string,
		milliseconds: number,
	): Promise<void> {
		const seconds = Math.max(1, Math.floor(milliseconds / 1000));
		this.logger.log(
			`Setting Redis TTL of ${seconds}s for finished game ${roomId}`,
		);
		try {
			await this.repository.setGameTtl(roomId, seconds);
		} catch (error) {
			this.logger.error(
				`Failed to set Redis TTL for game ${roomId}: ${error}`,
			);
		}
	}

	private removeTimerFromState(roomId: string, timerId: string): void {
		const timers = this.roomTimers.get(roomId);
		if (!timers) return;
		const idx = timers.findIndex((t) => t.id === timerId);
		if (idx !== -1) {
			clearTimeout(timers[idx].timeoutRef);
			timers.splice(idx, 1);
		}
		if (timers.length === 0) {
			this.roomTimers.delete(roomId);
		}
	}

	private removePausedTimer(roomId: string, timerId: string): void {
		const paused = this.pausedTimers.get(roomId);
		if (!paused) return;
		const idx = paused.findIndex((p) => p.id === timerId);
		if (idx !== -1) {
			paused.splice(idx, 1);
		}
		if (paused.length === 0) {
			this.pausedTimers.delete(roomId);
		}
	}
}
