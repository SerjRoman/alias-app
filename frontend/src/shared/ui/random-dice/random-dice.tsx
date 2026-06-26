import { Dices } from "lucide-react";
import { Button } from "../button/button";
import styles from "./random-dice.module.css";

interface RandomDiceProps {
	onClick: () => void;
	title?: string;
	className?: string;
}

export function RandomDice({
	onClick,
	title = "Generate name",
	className,
}: Readonly<RandomDiceProps>) {
	return (
		<Button
			type="button"
			onClick={onClick}
			className={`${styles.diceButton} ${className ?? ""}`}
			title={title}
			variant="outline"
		>
			<Dices size={18} />
		</Button>
	);
}
