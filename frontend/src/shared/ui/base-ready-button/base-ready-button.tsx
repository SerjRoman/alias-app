import { CheckCircle2, Circle } from "lucide-react";
import styles from "./base-ready-button.module.css";
import { Button } from "@shared/ui";

interface BaseReadyButtonProps {
	isReady: boolean;
	onClick: () => void;
	disabled?: boolean;
	labelReady?: string;
	labelNotReady?: string;
	className?: string;
	readyClassName?: string;
	notReadyClassName?: string;
}

export function BaseReadyButton({
	isReady,
	onClick,
	disabled,
	labelReady = "Ready!",
	labelNotReady = "I'm Ready",
	className,
	readyClassName,
	notReadyClassName,
}: Readonly<BaseReadyButtonProps>) {
	const buttonClass = [
		isReady ? readyClassName ?? styles.ready : notReadyClassName ?? styles.notReady,
		className,
	]
		.filter(Boolean)
		.join(" ");

	return (
		<Button className={buttonClass} onClick={onClick} disabled={disabled}>
			{isReady ? (
				<>
					<CheckCircle2 className={styles.icon} />
					<span>{labelReady}</span>
				</>
			) : (
				<>
					<Circle className={styles.icon} />
					<span>{labelNotReady}</span>
				</>
			)}
		</Button>
	);
}
