import type { SchedulerRegistry } from "@nestjs/schedule";
import type { IGameRepository } from "./game.repository.interface";
import { RoundScheduler } from "./round-scheduler.service";

describe("RoundScheduler", () => {
	let scheduler: RoundScheduler;
	let schedulerRegistry: jest.Mocked<SchedulerRegistry>;
	let repository: jest.Mocked<IGameRepository>;

	beforeEach(() => {
		jest.useFakeTimers();

		const timeouts = new Map<string, NodeJS.Timeout>();

		schedulerRegistry = {
			doesExist: jest.fn(
				(type: string, name: string) =>
					type === "timeout" && timeouts.has(name),
			),
			addTimeout: jest.fn((name: string, timeout: NodeJS.Timeout) => {
				timeouts.set(name, timeout);
			}),
			getTimeout: jest.fn((name: string) => {
				const t = timeouts.get(name);
				if (!t) throw new Error("Not found");
				return t;
			}),
			deleteTimeout: jest.fn((name: string) => {
				const t = timeouts.get(name);
				if (t) {
					clearTimeout(t);
					timeouts.delete(name);
				}
			}),
		} as unknown as jest.Mocked<SchedulerRegistry>;

		repository = {
			setGameTtl: jest.fn().mockResolvedValue(undefined),
		} as unknown as jest.Mocked<IGameRepository>;

		scheduler = new RoundScheduler(schedulerRegistry, repository);
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("Round timeout pause and resume", () => {
		it("schedules round timeout and executes callback when expired", () => {
			const callback = jest.fn();
			scheduler.scheduleRoundTimeout("room-1", 60000, callback);

			expect(schedulerRegistry.addTimeout).toHaveBeenCalled();
			expect(callback).not.toHaveBeenCalled();

			jest.advanceTimersByTime(60000);
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it("pauses round timeout and prevents execution while paused", () => {
			const callback = jest.fn();
			scheduler.scheduleRoundTimeout("room-1", 60000, callback);

			jest.advanceTimersByTime(20000);

			const remaining = scheduler.pauseRoundTimeout("room-1");
			expect(remaining).toBe(40000);
			expect(schedulerRegistry.deleteTimeout).toHaveBeenCalled();

			// Advance time past the original 60s
			jest.advanceTimersByTime(50000);
			expect(callback).not.toHaveBeenCalled();
		});

		it("resumes round timeout with remaining duration", () => {
			const callback = jest.fn();
			scheduler.scheduleRoundTimeout("room-1", 60000, callback);

			jest.advanceTimersByTime(25000);
			const remaining = scheduler.pauseRoundTimeout("room-1");
			expect(remaining).toBe(35000);

			// Some paused time passes...
			jest.advanceTimersByTime(100000);
			expect(callback).not.toHaveBeenCalled();

			// Resume with remaining time
			scheduler.resumeRoundTimeout("room-1", remaining ?? undefined);

			jest.advanceTimersByTime(34999);
			expect(callback).not.toHaveBeenCalled();

			jest.advanceTimersByTime(1);
			expect(callback).toHaveBeenCalledTimes(1);
		});
	});

	describe("Owner transfer timeout", () => {
		it("schedules owner transfer timeout and executes callback", () => {
			const callback = jest.fn();
			scheduler.scheduleOwnerTransferTimeout("room-1", 60000, callback);

			expect(schedulerRegistry.addTimeout).toHaveBeenCalledWith(
				"owner-transfer-timeout-room-1",
				expect.anything(),
			);

			jest.advanceTimersByTime(60000);
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it("clears owner transfer timeout if owner returns before timeout", () => {
			const callback = jest.fn();
			scheduler.scheduleOwnerTransferTimeout("room-1", 60000, callback);

			jest.advanceTimersByTime(30000);
			scheduler.clearOwnerTransferTimeout("room-1");

			jest.advanceTimersByTime(40000);
			expect(callback).not.toHaveBeenCalled();
		});
	});

	describe("Unified Room Timers Array (pauseAll, resumeAll, pauseTimer, resumeTimer)", () => {
		it("pauses all active room timers and resumes them", () => {
			const roundCb = jest.fn();
			const effectCb = jest.fn();

			scheduler.scheduleRoundTimeout("room-1", 60000, roundCb);
			scheduler.scheduleEffectTimeout("room-1", "eff-1", 5000, effectCb);

			// 2 seconds pass
			jest.advanceTimersByTime(2000);

			const pausedMap = scheduler.pauseAll("room-1");
			expect(pausedMap.get("round")).toBe(58000);
			expect(pausedMap.get("effect-eff-1")).toBe(3000);

			// 10 seconds pass while paused
			jest.advanceTimersByTime(10000);
			expect(roundCb).not.toHaveBeenCalled();
			expect(effectCb).not.toHaveBeenCalled();

			// Resume all
			scheduler.resumeAll("room-1");

			// Advance 3 seconds -> effect fires
			jest.advanceTimersByTime(3000);
			expect(effectCb).toHaveBeenCalledTimes(1);
			expect(roundCb).not.toHaveBeenCalled();

			// Advance 55 seconds -> round fires
			jest.advanceTimersByTime(55000);
			expect(roundCb).toHaveBeenCalledTimes(1);
		});

		it("pauses and resumes a specific timer by id", () => {
			const callback = jest.fn();
			scheduler.scheduleTimer("room-1", "custom-1", 10000, callback);

			jest.advanceTimersByTime(4000);
			const remaining = scheduler.pauseTimer("room-1", "custom-1");
			expect(remaining).toBe(6000);

			jest.advanceTimersByTime(20000);
			expect(callback).not.toHaveBeenCalled();

			scheduler.resumeTimer("room-1", "custom-1");
			jest.advanceTimersByTime(6000);
			expect(callback).toHaveBeenCalledTimes(1);
		});

		it("clears all timers in room on clearRoom", () => {
			const cb1 = jest.fn();
			const cb2 = jest.fn();

			scheduler.scheduleRoundTimeout("room-1", 60000, cb1);
			scheduler.scheduleEffectTimeout("room-1", "eff-1", 5000, cb2);

			scheduler.clearRoom("room-1");

			jest.advanceTimersByTime(100000);
			expect(cb1).not.toHaveBeenCalled();
			expect(cb2).not.toHaveBeenCalled();
		});
	});
});
