import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Pause } from "lucide-react";
import styles from "./arena-timer.module.css";

interface ArenaTimerProps {
	expiresAt?: number;
	pausedAt?: number | null;
	remainingMs?: number | null;
	totalDuration?: number;
	isActive?: boolean;
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
	isActive = false,
}: Readonly<ArenaTimerProps>) {
	const { t } = useTranslation();
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

	const isDanger = Boolean(isActive && !pausedAt && displaySeconds <= 10);
	const isWarning = Boolean(
		isActive && !pausedAt && displaySeconds <= 20 && !isDanger,
	);
	const safeDuration = totalDuration > 0 ? totalDuration : 60;
	const barPercentage = isActive
		? Math.min((displaySeconds / safeDuration) * 100, 100)
		: 0;

	return (
		<div className={styles.timerSection}>
			<div
				className={`${styles.timerDisplay} ${
					isDanger ? styles.danger : isWarning ? styles.warning : ""
				}`}
			>
				<Clock size={26} />
				<span>{formattedTime}</span>
				{pausedAt && (
					<span className={styles.pausedBadge}>
						<Pause size={11} fill="currentColor" />
						<span>{t("gameView.paused")}</span>
					</span>
				)}
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
