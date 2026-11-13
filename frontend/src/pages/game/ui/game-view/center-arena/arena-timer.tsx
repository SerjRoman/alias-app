import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import styles from "./arena-timer.module.css";

interface ArenaTimerProps {
	expiresAt?: number;
	pausedAt?: number | null;
	remainingMs?: number | null;
	totalDuration?: number;
}

function calcRemainingSeconds(
	expiresAt?: number,
	pausedAt?: number | null,
	remainingMs?: number | null,
): number {
	if (pausedAt && remainingMs != null) {
		return Math.max(0, Math.ceil(remainingMs / 1000));
	}
	if (!expiresAt) return 0;
	const now = pausedAt ?? Date.now();
	return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

export function ArenaTimer({
	expiresAt,
	pausedAt,
	remainingMs,
	totalDuration = 60,
}: Readonly<ArenaTimerProps>) {
	const [remainingSeconds, setRemainingSeconds] = useState(() =>
		calcRemainingSeconds(expiresAt, pausedAt, remainingMs),
	);

	useEffect(() => {
		if (!expiresAt || pausedAt) return;
		const interval = setInterval(() => {
			const diff = calcRemainingSeconds(expiresAt);
			setRemainingSeconds(diff);
			if (diff <= 0) clearInterval(interval);
		}, 250);
		return () => clearInterval(interval);
	}, [expiresAt, pausedAt]);

	const displaySeconds = pausedAt
		? calcRemainingSeconds(expiresAt, pausedAt, remainingMs)
		: remainingSeconds;

	const minutes = Math.floor(displaySeconds / 60);
	const seconds = displaySeconds % 60;
	const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
		seconds,
	).padStart(2, "0")}`;

	const isDanger = displaySeconds <= 10;
	const isWarning = displaySeconds <= 20 && !isDanger;
	const safeDuration = totalDuration > 0 ? totalDuration : 60;
	const barPercentage = Math.min((displaySeconds / safeDuration) * 100, 100);

	return (
		<div className={styles.timerSection}>
			<div
				className={`${styles.timerDisplay} ${
					isDanger ? styles.danger : isWarning ? styles.warning : ""
				}`}
			>
				<Clock size={28} />
				<span>
					{formattedTime}
					{pausedAt ? " ⏸" : ""}
				</span>
			</div>

			<div className={styles.timerBarContainer}>
				<div
					className={`${styles.timerBarFill} ${
						isDanger
							? styles.danger
							: isWarning
								? styles.warning
								: ""
					}`}
					style={{ width: `${barPercentage}%` }}
				/>
			</div>
		</div>
	);
}
