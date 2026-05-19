import { CheckCircle2, Circle } from "lucide-react";
import styles from "./base-ready-button.module.css";
import { Button } from "@shared/ui";

interface BaseReadyButtonProps {
	isReady: boolean;
	onClick: () => void;
	disabled?: boolean;
	labelReady?: string;
	labelNotReady?: string;
}

export function BaseReadyButton({
	isReady,
	onClick,
	disabled,
	labelReady = "Ready!",
	labelNotReady = "I'm Ready",
}: Readonly<BaseReadyButtonProps>) {
	const buttonClass = isReady ? styles.ready : styles.notReady;

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
