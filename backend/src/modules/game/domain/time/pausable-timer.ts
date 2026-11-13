/**
 * Polymorphic contract for any domain entity that tracks a time-limited lifecycle
 * with support for pausing and resuming (e.g. Round, ActiveEffect, BetPhase).
 */
export interface PausableTimer {
	durationMs?: number;
	expiresAt?: number;
	pausedAt?: number | null;
	remainingMs?: number | null;
}

/**
 * Pauses an active timer at timestamp `now`.
 * Computes remaining time and records pausedAt.
 * Returns remaining milliseconds, or null if timer was not active/already paused.
 */
export function pauseTimer(timer: PausableTimer, now: number): number | null {
	const deadline = timer.expiresAt;
	if (!deadline || timer.pausedAt) {
		return null;
	}

	const remaining = Math.max(0, deadline - now);
	timer.pausedAt = now;
	timer.remainingMs = remaining;
	return remaining;
}

/**
 * Resumes a paused timer at timestamp `now`.
 * Advances deadline (expiresAt) by remainingMs, clears paused state.
 * Returns new deadline timestamp, or null if timer was not paused.
 */
export function resumeTimer(timer: PausableTimer, now: number): number | null {
	if (!timer.pausedAt) {
		return null;
	}

	const remaining = timer.remainingMs ?? 0;
	const newDeadline = now + remaining;

	timer.expiresAt = newDeadline;
	timer.pausedAt = null;
	timer.remainingMs = null;
	return newDeadline;
}
