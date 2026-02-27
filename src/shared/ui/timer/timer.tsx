import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import styles from "./timer.module.css";

interface GameTimerProps {
	endTime: number;
	totalDuration?: number;
}

export function Timer({ endTime }: Readonly<GameTimerProps>) {
	const [timeLeft, setTimeLeft] = useState(0);

	useEffect(() => {
		const tick = () => {
			const now = Date.now();
			const delta = endTime - now;

			if (delta <= 0) {
				setTimeLeft(0);
				return;
			}

			setTimeLeft(Math.ceil(delta / 1000));
		};

		tick();

		const intervalId = setInterval(tick, 100);

		return () => clearInterval(intervalId);
	}, [endTime]);

	const minutes = Math.floor(timeLeft / 60);
	const seconds = timeLeft % 60;
	const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
		.toString()
		.padStart(2, "0")}`;

	const isCritical = timeLeft <= 10 && timeLeft > 0;
	const containerClass = `${styles.container} ${isCritical ? styles.critical : ""}`;

	return (
		<div className={containerClass}>
			<Clock className={styles.icon} />
			<span>{formattedTime}</span>
		</div>
	);
}
