import { pauseTimer, resumeTimer, type PausableTimer } from "./pausable-timer";

describe("PausableTimer", () => {
	it("pauses an active timer and calculates remainingMs", () => {
		const timer: PausableTimer = {
			expiresAt: 10_000,
		};
		const now = 3_000;

		const remaining = pauseTimer(timer, now);

		expect(remaining).toBe(7_000);
		expect(timer.pausedAt).toBe(3_000);
		expect(timer.remainingMs).toBe(7_000);
	});

	it("clamps remainingMs to 0 if now is past deadline", () => {
		const timer: PausableTimer = {
			expiresAt: 5_000,
		};
		const now = 6_000;

		const remaining = pauseTimer(timer, now);

		expect(remaining).toBe(0);
		expect(timer.remainingMs).toBe(0);
	});

	it("does not pause an already paused timer (idempotent)", () => {
		const timer: PausableTimer = {
			expiresAt: 10_000,
			pausedAt: 4_000,
			remainingMs: 6_000,
		};

		const result = pauseTimer(timer, 5_000);

		expect(result).toBeNull();
		expect(timer.pausedAt).toBe(4_000);
		expect(timer.remainingMs).toBe(6_000);
	});

	it("resumes a paused timer and shifts expiresAt forward by remainingMs", () => {
		const timer: PausableTimer = {
			expiresAt: 10_000,
			pausedAt: 4_000,
			remainingMs: 6_000,
		};
		const resumeTime = 8_000;

		const newDeadline = resumeTimer(timer, resumeTime);

		expect(newDeadline).toBe(14_000); // 8_000 + 6_000
		expect(timer.expiresAt).toBe(14_000);
		expect(timer.pausedAt).toBeNull();
		expect(timer.remainingMs).toBeNull();
	});

	it("does not resume a timer that is not paused", () => {
		const timer: PausableTimer = {
			expiresAt: 10_000,
			pausedAt: null,
		};

		const result = resumeTimer(timer, 5_000);

		expect(result).toBeNull();
		expect(timer.expiresAt).toBe(10_000);
	});
});
